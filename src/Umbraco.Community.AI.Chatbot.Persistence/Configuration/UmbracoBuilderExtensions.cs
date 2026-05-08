using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.AI.Chatbot.Core.Configuration;
using Umbraco.Community.AI.Chatbot.Persistence.ChatInstances;
using Umbraco.Community.AI.Chatbot.Persistence.Notifications;
using Umbraco.Extensions;

namespace Umbraco.Community.AI.Chatbot.Persistence.Configuration;

public static class UmbracoBuilderExtensions
{
    public static IUmbracoBuilder AddChatbotPersistence(this IUmbracoBuilder builder)
    {
        builder.Services.AddUmbracoDbContext<UmbracoCommunityAIChatbotDbContext>((options, connectionString, providerName, _) =>
        {
            UmbracoCommunityAIChatbotDbContext.ConfigureProvider(options, connectionString, providerName);
        });

        builder.Services.TryAddSingleton<IChatInstanceRepository, EFCoreChatInstanceRepository>();

        builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, RunChatbotMigrationNotificationHandler>();

        return builder;
    }
}
