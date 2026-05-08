using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.AI.Chatbot.Web.Api.Public;
using Umbraco.Community.AI.Chatbot.Web.RateLimiting;

namespace Umbraco.Community.AI.Chatbot.Web.Configuration;

public static class UmbracoBuilderExtensions
{
    /// <summary>
    /// Registers the Web layer's MVC application part so the host app discovers our controllers,
    /// even though they ship from a referenced assembly.
    /// </summary>
    public static IUmbracoBuilder AddChatbotWeb(this IUmbracoBuilder builder)
    {
        // Umbraco already calls AddControllers in its own composition. AddControllers is safe to
        // call again — it mutates the shared ApplicationPartManager rather than rebuilding MVC.
        builder.Services
            .AddControllers()
            .AddApplicationPart(typeof(ChatController).Assembly);

        // Rate limit options bound from `Umbraco:Community:Chatbot:RateLimit`.
        // The filter is a singleton so its in-memory window state survives across requests.
        builder.Services.AddOptions<ChatbotRateLimitOptions>()
            .BindConfiguration(ChatbotRateLimitOptions.ConfigPath);
        builder.Services.AddSingleton<PerIpRateLimitFilter>();

        return builder;
    }
}
