using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.AI.Chatbot.Core.Chat;
using Umbraco.Community.AI.Chatbot.Core.Configuration;
using Umbraco.Community.AI.Chatbot.Core.Members;
using Umbraco.Community.AI.Chatbot.Core.Search;

namespace Umbraco.Community.AI.Chatbot.Core.Extensions;

public static class UmbracoBuilderExtensions
{
    /// <summary>
    /// Registers the Core services (orchestration, search wrapper, default principal accessor).
    /// Persistence and Web are registered separately by their own builder extensions.
    /// </summary>
    public static IUmbracoBuilder AddChatbotCore(this IUmbracoBuilder builder)
    {
        builder.Services.TryAddSingleton<IChatPrincipalAccessor, AnonymousChatPrincipalAccessor>();
        builder.Services.TryAddTransient<IContentResolver, ContentResolver>();
        builder.Services.TryAddTransient<IChatOrchestrator, ChatOrchestrator>();
        builder.Services.TryAddTransient<FollowUpGenerator>();
        builder.Services.TryAddTransient<IChatInstanceService, ChatInstanceService>();
        return builder;
    }
}
