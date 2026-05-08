namespace Umbraco.Community.AI.Chatbot.Core.Chat;

/// <summary>
/// A single conversation message. The widget owns conversation history and replays it on each turn,
/// so the server is stateless.
/// </summary>
public sealed record ChatTurn(string Role, string Content)
{
    public const string RoleUser = "user";
    public const string RoleAssistant = "assistant";
}
