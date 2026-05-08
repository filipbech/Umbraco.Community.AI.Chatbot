using System.ComponentModel.DataAnnotations;

namespace Umbraco.Community.AI.Chatbot.Web.Api.Public;

/// <summary>
/// Body of a public chat request. The widget sends the full conversation each turn (server is stateless).
/// Caps are intentional: the endpoint is anonymous, so we put hard limits on size to keep one
/// abusive client from spending the host's token budget.
/// </summary>
public sealed class ChatRequestModel
{
    /// <summary>Max number of turns we accept per request. Anything older the widget should drop.</summary>
    public const int MaxMessages = 50;

    /// <summary>Max characters per individual message. Roughly 1k tokens.</summary>
    public const int MaxContentLength = 4000;

    [Required]
    [StringLength(100)]
    public string InstanceAlias { get; set; } = string.Empty;

    [Required]
    [MaxLength(MaxMessages)]
    public List<ChatMessageModel> Messages { get; set; } = [];
}

public sealed class ChatMessageModel
{
    /// <summary>Either <c>"user"</c> or <c>"assistant"</c>.</summary>
    [Required]
    [StringLength(20)]
    public string Role { get; set; } = string.Empty;

    [Required]
    [StringLength(ChatRequestModel.MaxContentLength)]
    public string Content { get; set; } = string.Empty;
}
