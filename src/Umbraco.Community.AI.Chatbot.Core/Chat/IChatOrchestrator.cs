using Umbraco.Community.AI.Chatbot.Core.Configuration;

namespace Umbraco.Community.AI.Chatbot.Core.Chat;

public interface IChatOrchestrator
{
    /// <summary>
    /// Runs one chat turn end-to-end: search → ground → stream → suggest. Each yielded event is a
    /// frame the SSE controller writes verbatim.
    /// </summary>
    IAsyncEnumerable<ChatStreamEvent> RunAsync(
        ChatInstance instance,
        IReadOnlyList<ChatTurn> conversation,
        CancellationToken cancellationToken = default);
}
