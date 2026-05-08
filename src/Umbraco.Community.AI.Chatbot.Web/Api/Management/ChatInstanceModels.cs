using System.ComponentModel.DataAnnotations;

namespace Umbraco.Community.AI.Chatbot.Web.Api.Management;

public sealed class ChatInstanceResponseModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
    public string AgentAlias { get; set; } = string.Empty;
    public string? WelcomeMessage { get; set; }
    public string FallbackMessage { get; set; } = string.Empty;
    public int TopK { get; set; }
    public int SuggestionCount { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime DateModified { get; set; }
}

public sealed class CreateOrUpdateChatInstanceRequestModel
{
    [Required, StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string Alias { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string AgentAlias { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? WelcomeMessage { get; set; }

    [Required, StringLength(2000)]
    public string FallbackMessage { get; set; } = string.Empty;

    [Range(1, 50)]
    public int TopK { get; set; } = 5;

    [Range(0, 5)]
    public int SuggestionCount { get; set; } = 3;

    public bool Enabled { get; set; } = true;
}
