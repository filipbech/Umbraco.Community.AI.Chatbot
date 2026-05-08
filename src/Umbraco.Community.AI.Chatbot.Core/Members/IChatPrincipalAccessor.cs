using Umbraco.Cms.Search.Core.Models.Searching;

namespace Umbraco.Community.AI.Chatbot.Core.Members;

/// <summary>
/// Hook point for member-aware access. The MVP returns null (anonymous, public-only content).
/// A future Member integration replaces this with one that maps the current Umbraco Member
/// to an <see cref="AccessContext"/> so protected content can be retrieved when appropriate.
/// </summary>
public interface IChatPrincipalAccessor
{
    AccessContext? GetAccessContext();
}
