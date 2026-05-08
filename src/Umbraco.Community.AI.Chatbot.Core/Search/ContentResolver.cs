using System.Text.RegularExpressions;
using System.Web;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Search.Core.Search;
using Umbraco.AI.Search.Core.VectorStore;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Search.Core.Models.Searching;
using Umbraco.Extensions;

namespace Umbraco.Community.AI.Chatbot.Core.Search;

/// <summary>
/// Default content resolver. Calls <see cref="AIVectorSearcher"/> via the public ISearcher
/// surface, then resolves each document key via <see cref="IUmbracoContextAccessor"/> to
/// produce title/url/body. Body text is harvested from text-typed published properties up
/// to <see cref="MaxBodyCharsPerSource"/> total.
/// </summary>
internal sealed class ContentResolver : IContentResolver
{
    /// <summary>The CMS Search index alias the AI search package indexes content into.</summary>
    /// <remarks>Mirrors <c>Umbraco.AI.Search.Core.AISearchConstants.IndexAliases.Search</c>.</remarks>
    public const string IndexAlias = "UmbAI_Search";

    /// <summary>
    /// Per-source body cap. Five sources × 4000 chars ≈ 5000 tokens of context, comfortable for any modern model.
    /// </summary>
    private const int MaxBodyCharsPerSource = 4000;

    private readonly AIVectorSearcher _searcher;
    private readonly IUmbracoContextAccessor _umbracoContextAccessor;
    private readonly ILogger<ContentResolver> _logger;

    public ContentResolver(
        AIVectorSearcher searcher,
        IUmbracoContextAccessor umbracoContextAccessor,
        ILogger<ContentResolver> logger)
    {
        _searcher = searcher;
        _umbracoContextAccessor = umbracoContextAccessor;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ResolvedSource>> ResolveAsync(
        string query,
        int topK,
        AccessContext? accessContext,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        SearchResult searchResult;
        try
        {
            searchResult = await _searcher.SearchAsync(
                indexAlias: IndexAlias,
                query: query,
                filters: null,
                facets: null,
                sorters: null,
                culture: null,
                segment: null,
                accessContext: accessContext,
                skip: 0,
                take: topK,
                maxSuggestions: 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Semantic search failed for query \"{Query}\"", query);
            return [];
        }

        if (!_umbracoContextAccessor.TryGetUmbracoContext(out var umbracoContext) || umbracoContext is null)
        {
            _logger.LogWarning("UmbracoContext unavailable; cannot resolve search results to published content.");
            return [];
        }

        var resolved = new List<ResolvedSource>();
        foreach (var doc in searchResult.Documents)
        {
            cancellationToken.ThrowIfCancellationRequested();

            IPublishedContent? content = doc.ObjectType == Cms.Core.Models.UmbracoObjectTypes.Media
                ? umbracoContext.Media?.GetById(doc.Id)
                : umbracoContext.Content?.GetById(doc.Id);

            if (content is null)
            {
                continue;
            }

            var body = ExtractText(content);
            if (string.IsNullOrWhiteSpace(body))
            {
                continue;
            }

            resolved.Add(new ResolvedSource(
                DocumentId: content.Key,
                Title: content.Name ?? content.Key.ToString(),
                Url: content.Url(),
                BodyText: body));
        }

        return resolved;
    }

    /// <summary>
    /// Recursively pulls text out of every property on the page so block lists, block grids,
    /// nested content and rich-text editors all contribute their content (not just primitive
    /// strings). Stops once the per-source budget is reached. Without this the model only sees
    /// page titles and produces fallbacks for content that's actually indexed.
    /// </summary>
    private string ExtractText(IPublishedContent content)
    {
        var sb = new System.Text.StringBuilder();
        sb.Append(content.Name);
        sb.Append('\n');

        foreach (var prop in content.Properties)
        {
            if (sb.Length >= MaxBodyCharsPerSource) break;
            AppendValue(sb, prop.GetValue(), depth: 0);
        }

        var text = sb.ToString();
        return text.Length > MaxBodyCharsPerSource
            ? text[..MaxBodyCharsPerSource]
            : text;
    }

    private const int MaxRecursionDepth = 4;
    private static readonly Regex HtmlTagRegex = new("<[^>]+>", RegexOptions.Compiled);
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    private void AppendValue(System.Text.StringBuilder sb, object? value, int depth)
    {
        if (value is null || depth > MaxRecursionDepth) return;

        switch (value)
        {
            case string s when !string.IsNullOrWhiteSpace(s):
                sb.Append(s.Trim()).Append('\n');
                return;

            case string:
                return;

            case IHtmlEncodedString html:
                AppendHtml(sb, html.ToString());
                return;

            // Any IPublishedElement (and IPublishedContent) — recurse through its own properties.
            // Block list / block grid items typically expose an inner IPublishedElement we hit
            // through the wrapper-Content fallback below.
            case IPublishedElement element:
                foreach (var prop in element.Properties)
                {
                    if (sb.Length >= MaxBodyCharsPerSource) return;
                    AppendValue(sb, prop.GetValue(), depth + 1);
                }
                return;

            case System.Collections.IEnumerable enumerable:
                foreach (var item in enumerable)
                {
                    if (sb.Length >= MaxBodyCharsPerSource) return;
                    AppendValue(sb, item, depth + 1);
                }
                return;
        }

        // BlockListItem / BlockGridItem and similar wrappers expose a `.Content` of type IPublishedElement.
        // Generic block items (BlockListItem<TContent>) can have multiple declared `Content` properties
        // (one inherited, one shadowed) so a plain GetProperty("Content") throws AmbiguousMatchException.
        // Pick the one whose type implements IPublishedElement.
        try
        {
            var contentProp = value.GetType()
                .GetProperties()
                .FirstOrDefault(p => p.Name == "Content" && typeof(IPublishedElement).IsAssignableFrom(p.PropertyType));
            if (contentProp?.GetValue(value) is IPublishedElement inner)
            {
                AppendValue(sb, inner, depth + 1);
                return;
            }
        }
        catch (Exception ex)
        {
            // Reflection failure on an unfamiliar wrapper — fall through to ToString below.
            // Logged at Trace so a future "why doesn't this block type extract" investigation has
            // breadcrumbs without flooding logs at higher levels.
            _logger.LogTrace(ex, "Reflection failed resolving wrapper Content for {Type}", value.GetType().FullName);
        }

        // Skip raw type-name ToStrings — they pollute the context window.
        var str = value.ToString();
        if (string.IsNullOrEmpty(str) ||
            str.StartsWith("Umbraco.", StringComparison.Ordinal) ||
            str.StartsWith("System.", StringComparison.Ordinal))
        {
            return;
        }
        sb.Append(str).Append('\n');
    }

    private static void AppendHtml(System.Text.StringBuilder sb, string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return;
        var stripped = HtmlTagRegex.Replace(html, " ");
        var decoded = HttpUtility.HtmlDecode(stripped);
        var collapsed = WhitespaceRegex.Replace(decoded, " ").Trim();
        if (collapsed.Length > 0)
        {
            sb.Append(collapsed).Append('\n');
        }
    }
}
