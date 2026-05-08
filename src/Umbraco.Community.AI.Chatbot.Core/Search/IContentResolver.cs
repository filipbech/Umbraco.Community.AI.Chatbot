using Umbraco.Cms.Search.Core.Models.Searching;

namespace Umbraco.Community.AI.Chatbot.Core.Search;

/// <summary>
/// Runs the semantic search and enriches the matched documents with the data the
/// orchestrator needs (title, url, body text for grounding).
/// </summary>
public interface IContentResolver
{
    Task<IReadOnlyList<ResolvedSource>> ResolveAsync(
        string query,
        int topK,
        AccessContext? accessContext,
        CancellationToken cancellationToken = default);
}
