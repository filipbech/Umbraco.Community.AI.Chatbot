namespace Umbraco.Community.AI.Chatbot.Persistence.ChatInstances;

internal class ChatInstanceEntity
{
    public Guid Id { get; set; }

    public string? Name { get; set; }

    public string Alias { get; set; } = string.Empty;

    public string AgentAlias { get; set; } = string.Empty;

    public string? WelcomeMessage { get; set; }

    public string FallbackMessage { get; set; } = string.Empty;

    public int TopK { get; set; } = 5;

    public int SuggestionCount { get; set; } = 3;

    public bool Enabled { get; set; } = true;

    public DateTime DateCreated { get; set; }

    public DateTime DateModified { get; set; }
}
