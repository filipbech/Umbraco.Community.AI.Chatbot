using Umbraco.Community.AI.Chatbot.Core.Configuration;

namespace Umbraco.Community.AI.Chatbot.Persistence.ChatInstances;

internal static class ChatInstanceEntityFactory
{
    public static ChatInstance BuildDomain(ChatInstanceEntity entity) => new()
    {
        Id = entity.Id,
        // Pre-Name rows: fall back to alias so the backoffice always has something to show.
        Name = string.IsNullOrWhiteSpace(entity.Name) ? entity.Alias : entity.Name!,
        Alias = entity.Alias,
        AgentAlias = entity.AgentAlias,
        WelcomeMessage = entity.WelcomeMessage,
        FallbackMessage = entity.FallbackMessage,
        TopK = entity.TopK,
        SuggestionCount = entity.SuggestionCount,
        Enabled = entity.Enabled,
        DateCreated = entity.DateCreated,
        DateModified = entity.DateModified,
    };

    public static ChatInstanceEntity BuildEntity(ChatInstance instance) => new()
    {
        Id = instance.Id,
        Name = instance.Name,
        Alias = instance.Alias,
        AgentAlias = instance.AgentAlias,
        WelcomeMessage = instance.WelcomeMessage,
        FallbackMessage = instance.FallbackMessage,
        TopK = instance.TopK,
        SuggestionCount = instance.SuggestionCount,
        Enabled = instance.Enabled,
        DateCreated = instance.DateCreated,
        DateModified = instance.DateModified,
    };

    public static void UpdateEntity(ChatInstanceEntity target, ChatInstance source)
    {
        target.Name = source.Name;
        target.Alias = source.Alias;
        target.AgentAlias = source.AgentAlias;
        target.WelcomeMessage = source.WelcomeMessage;
        target.FallbackMessage = source.FallbackMessage;
        target.TopK = source.TopK;
        target.SuggestionCount = source.SuggestionCount;
        target.Enabled = source.Enabled;
        target.DateModified = source.DateModified;
    }
}
