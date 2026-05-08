using Umbraco.AI.Agent.Startup.Configuration;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.AI.Chatbot.Core.Extensions;
using Umbraco.Community.AI.Chatbot.Persistence.Configuration;
using Umbraco.Community.AI.Chatbot.Web.Configuration;

namespace Umbraco.Community.AI.Chatbot.Startup;

/// <summary>
/// Wires Core, Persistence, and Web on app start. Composes after Umbraco.AI.Agent so the
/// agent services are available when our orchestrator resolves them.
/// </summary>
[ComposeAfter(typeof(UmbracoAIAgentComposer))]
public class UmbracoCommunityAIChatbotComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder
            .AddChatbotCore()
            .AddChatbotPersistence()
            .AddChatbotWeb();
    }
}
