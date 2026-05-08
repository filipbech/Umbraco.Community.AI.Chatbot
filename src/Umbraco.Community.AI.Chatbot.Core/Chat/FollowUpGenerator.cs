using System.Text;
using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Agent.Core.Agents;
using Umbraco.Community.AI.Chatbot.Core.Search;

namespace Umbraco.Community.AI.Chatbot.Core.Chat;

/// <summary>
/// Generates 3 short follow-up questions after the main answer streams. Implemented as a non-streamed
/// second-pass call — cheaper and simpler than re-using the streaming path.
/// </summary>
internal sealed class FollowUpGenerator
{
    private readonly IAIAgentService _agentService;
    private readonly ILogger<FollowUpGenerator> _logger;

    public FollowUpGenerator(IAIAgentService agentService, ILogger<FollowUpGenerator> logger)
    {
        _agentService = agentService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<string>> GenerateAsync(
        string agentAlias,
        int count,
        IReadOnlyList<ChatTurn> conversation,
        string lastAnswer,
        IReadOnlyList<ResolvedSource> sources,
        CancellationToken cancellationToken = default)
    {
        if (count <= 0)
        {
            return [];
        }

        try
        {
            var transcript = BuildTranscript(conversation, lastAnswer);
            var topics = BuildTopicList(sources);

            // Grounding the follow-up generator in the same source set the answer was generated from
            // prevents the model from inventing questions about topics that aren't on this site.
            var systemPrompt = string.IsNullOrEmpty(topics)
                ? $"Suggest exactly {count} short follow-up question{(count == 1 ? "" : "s")} a website visitor might ask next, based on the assistant's last answer. " +
                  "Return STRICT JSON in this shape: {\"suggestions\":[\"...\"]}. No prose, no markdown."
                : $"Suggest up to {count} short follow-up question{(count == 1 ? "" : "s")} a website visitor might ask next. " +
                  "ONLY suggest questions whose answers can plausibly be found in the topics below — do not invent topics. " +
                  $"If fewer than {count} fit, return fewer. Keep questions short and natural.\n\n" +
                  "AVAILABLE TOPICS (page titles from this website):\n" + topics + "\n\n" +
                  "Return STRICT JSON in this shape: {\"suggestions\":[\"...\"]}. No prose, no markdown.";

            var messages = new List<ChatMessage>
            {
                new(ChatRole.System, systemPrompt),
                new(ChatRole.User, transcript),
            };

            var response = await _agentService.RunAgentAsync(agentAlias, messages, cancellationToken: cancellationToken);
            var text = response.Text ?? string.Empty;

            return ParseSuggestions(text, count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Follow-up generation failed; returning empty list.");
            return [];
        }
    }

    private static string BuildTopicList(IReadOnlyList<ResolvedSource> sources)
    {
        if (sources.Count == 0)
        {
            return string.Empty;
        }
        var sb = new StringBuilder();
        foreach (var s in sources)
        {
            sb.Append("- ").AppendLine(s.Title);
        }
        return sb.ToString().TrimEnd();
    }

    private static string BuildTranscript(IReadOnlyList<ChatTurn> conversation, string lastAnswer)
    {
        var sb = new StringBuilder();
        foreach (var turn in conversation)
        {
            sb.Append(turn.Role.ToUpperInvariant()).Append(": ").AppendLine(turn.Content);
        }
        sb.Append("ASSISTANT: ").AppendLine(lastAnswer);
        return sb.ToString();
    }

    internal static IReadOnlyList<string> ParseSuggestions(string raw, int max)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return [];
        }

        // Tolerate stray prose around the JSON object.
        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            return [];
        }

        var json = raw[start..(end + 1)];
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("suggestions", out var arr) || arr.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            var list = new List<string>();
            foreach (var element in arr.EnumerateArray())
            {
                var text = element.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    list.Add(text);
                }
                if (list.Count == max)
                {
                    break;
                }
            }
            return list;
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
