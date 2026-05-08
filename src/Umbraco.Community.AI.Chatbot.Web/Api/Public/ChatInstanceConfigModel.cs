namespace Umbraco.Community.AI.Chatbot.Web.Api.Public;

/// <summary>
/// Public, anonymously-readable config for a chat instance — only the fields the widget
/// needs to render before the first message. Backoffice-only fields (agent alias, top K,
/// fallback wording) are intentionally not exposed.
/// </summary>
public sealed class ChatInstanceConfigModel
{
    public string Alias { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? WelcomeMessage { get; set; }
}
