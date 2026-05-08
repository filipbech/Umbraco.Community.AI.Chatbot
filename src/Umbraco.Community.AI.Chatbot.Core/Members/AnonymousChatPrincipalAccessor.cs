using Umbraco.Cms.Search.Core.Models.Searching;

namespace Umbraco.Community.AI.Chatbot.Core.Members;

/// <summary>
/// Default accessor for the MVP. Returns no access context, which means only unprotected content
/// will be retrieved by <c>AIVectorSearcher</c>.
/// </summary>
public sealed class AnonymousChatPrincipalAccessor : IChatPrincipalAccessor
{
    public AccessContext? GetAccessContext() => null;
}
