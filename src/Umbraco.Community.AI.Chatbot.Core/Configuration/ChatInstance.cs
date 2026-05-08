namespace Umbraco.Community.AI.Chatbot.Core.Configuration;

/// <summary>
/// A configured chat instance — the unit a website embeds and the public endpoint dispatches against.
/// </summary>
public sealed class ChatInstance
{
    public Guid Id { get; set; }

    /// <summary>Display name shown in the backoffice. The alias is auto-derived from this.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-safe identifier the public endpoint accepts (e.g. <c>site-search</c>).</summary>
    public string Alias { get; set; } = string.Empty;

    /// <summary>Alias of the <c>Umbraco.AI.Agent</c> that produces answers for this instance.</summary>
    public string AgentAlias { get; set; } = string.Empty;

    /// <summary>Shown by the widget when the user opens it.</summary>
    public string? WelcomeMessage { get; set; }

    /// <summary>Used when search returned no usable sources — keeps the model from making stuff up.</summary>
    public string FallbackMessage { get; set; } =
        "I can only answer based on this site's content. I couldn't find anything about that here.";

    /// <summary>How many top search hits to inject into the agent's context.</summary>
    public int TopK { get; set; } = 5;

    /// <summary>How many follow-up question suggestions to generate after each answer (0 disables them).</summary>
    public int SuggestionCount { get; set; } = 3;

    /// <summary>Toggle without deletion.</summary>
    public bool Enabled { get; set; } = true;

    public DateTime DateCreated { get; set; }

    public DateTime DateModified { get; set; }
}
