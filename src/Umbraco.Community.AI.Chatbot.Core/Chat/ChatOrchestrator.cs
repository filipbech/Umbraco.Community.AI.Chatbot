using System.Runtime.CompilerServices;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Agent.Core.Agents;
using Umbraco.Community.AI.Chatbot.Core.Configuration;
using Umbraco.Community.AI.Chatbot.Core.Members;
using Umbraco.Community.AI.Chatbot.Core.Search;

namespace Umbraco.Community.AI.Chatbot.Core.Chat;

internal sealed class ChatOrchestrator : IChatOrchestrator
{
    private readonly IContentResolver _contentResolver;
    private readonly IAIAgentService _agentService;
    private readonly IChatPrincipalAccessor _principalAccessor;
    private readonly FollowUpGenerator _followUpGenerator;
    private readonly ILogger<ChatOrchestrator> _logger;

    public ChatOrchestrator(
        IContentResolver contentResolver,
        IAIAgentService agentService,
        IChatPrincipalAccessor principalAccessor,
        FollowUpGenerator followUpGenerator,
        ILogger<ChatOrchestrator> logger)
    {
        _contentResolver = contentResolver;
        _agentService = agentService;
        _principalAccessor = principalAccessor;
        _followUpGenerator = followUpGenerator;
        _logger = logger;
    }

    public async IAsyncEnumerable<ChatStreamEvent> RunAsync(
        ChatInstance instance,
        IReadOnlyList<ChatTurn> conversation,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var lastUserTurn = conversation.LastOrDefault(t => string.Equals(t.Role, ChatTurn.RoleUser, StringComparison.OrdinalIgnoreCase));
        if (lastUserTurn is null || string.IsNullOrWhiteSpace(lastUserTurn.Content))
        {
            yield return new ErrorEvent("No user message provided.");
            yield return new DoneEvent();
            yield break;
        }

        // 1. Search + resolve. Failure here is non-fatal: we still call the agent with no sources,
        //    which (per the strict prompt) makes it return the configured fallback.
        IReadOnlyList<ResolvedSource> sources = [];
        try
        {
            sources = await _contentResolver.ResolveAsync(
                lastUserTurn.Content,
                instance.TopK,
                _principalAccessor.GetAccessContext(),
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Source resolution failed.");
        }

        yield return new SourcesEvent(sources);

        // 2. Build the grounded prompt and stream the agent.
        var systemPrompt = GroundingPromptBuilder.Build(instance, sources);
        var messages = BuildAgentMessages(systemPrompt, conversation);

        var assembledAnswer = new System.Text.StringBuilder();

        IAsyncEnumerable<AgentResponseUpdate>? updates = null;
        string? streamStartError = null;
        try
        {
            updates = _agentService.StreamAgentAsync(
                instance.AgentAlias,
                messages,
                options: null,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start agent stream for instance {Alias} agent {AgentAlias}.", instance.Alias, instance.AgentAlias);
            streamStartError = "Could not start the agent.";
        }

        if (streamStartError is not null || updates is null)
        {
            yield return new ErrorEvent(streamStartError ?? "Could not start the agent.");
            yield return new DoneEvent();
            yield break;
        }

        await foreach (var update in updates.WithCancellation(cancellationToken))
        {
            var text = ExtractText(update);
            if (string.IsNullOrEmpty(text))
            {
                continue;
            }

            assembledAnswer.Append(text);
            yield return new DeltaEvent(text);
        }

        // 3. Suggest follow-ups (best effort) — pass the same sources the answer was grounded in
        //    so the model proposes questions about topics that actually exist in the index.
        var suggestions = await _followUpGenerator.GenerateAsync(
            instance.AgentAlias,
            instance.SuggestionCount,
            conversation,
            assembledAnswer.ToString(),
            sources,
            cancellationToken);

        if (suggestions.Count > 0)
        {
            yield return new SuggestionsEvent(suggestions);
        }

        yield return new DoneEvent();
    }

    private static List<ChatMessage> BuildAgentMessages(string systemPrompt, IReadOnlyList<ChatTurn> conversation)
    {
        var messages = new List<ChatMessage>(conversation.Count + 1)
        {
            new(ChatRole.System, systemPrompt),
        };

        foreach (var turn in conversation)
        {
            var role = string.Equals(turn.Role, ChatTurn.RoleAssistant, StringComparison.OrdinalIgnoreCase)
                ? ChatRole.Assistant
                : ChatRole.User;
            messages.Add(new ChatMessage(role, turn.Content));
        }

        return messages;
    }

    private static string ExtractText(AgentResponseUpdate update)
    {
        if (update.Contents is null)
        {
            return string.Empty;
        }

        var sb = new System.Text.StringBuilder();
        foreach (var content in update.Contents)
        {
            if (content is TextContent tc)
            {
                sb.Append(tc.Text);
            }
        }
        return sb.ToString();
    }
}
