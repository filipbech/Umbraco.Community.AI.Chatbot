namespace Umbraco.Community.AI.Chatbot.Core.Search;

/// <summary>
/// A search hit enriched with the published-content fields the agent needs for grounding
/// (text body) and the widget needs for citation (title, url).
/// </summary>
/// <param name="DocumentId">The Umbraco content/media key.</param>
/// <param name="Title">Display name of the page (Name on IPublishedContent).</param>
/// <param name="Url">Public URL, or null if the content has no rendered URL (e.g. media without a route).</param>
/// <param name="BodyText">
/// Concatenated text of the page's text properties, used as the grounding source. Truncated by
/// <see cref="ContentResolver"/> to a configurable per-source budget so we don't blow the context window.
/// </param>
public sealed record ResolvedSource(
    Guid DocumentId,
    string Title,
    string? Url,
    string BodyText);
