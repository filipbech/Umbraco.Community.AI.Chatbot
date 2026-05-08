using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Core.Configuration;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.AI.Chatbot.Persistence.ChatInstances;

namespace Umbraco.Community.AI.Chatbot.Persistence.Notifications;

internal sealed class RunChatbotMigrationNotificationHandler
    : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RunChatbotMigrationNotificationHandler> _logger;

    public RunChatbotMigrationNotificationHandler(
        IConfiguration configuration,
        ILogger<RunChatbotMigrationNotificationHandler> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
    {
        try
        {
            // Reuse Umbraco.AI's resolver — it pulls the optional dedicated AI connection string
            // and crucially calls GetUmbracoConnectionString, which resolves |DataDirectory| tokens
            // that raw IConfiguration access does not.
            var (connectionString, providerName) = AIConnectionStringResolver.Resolve(_configuration);

            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogDebug("No Umbraco connection string available — skipping Chatbot migrations (Umbraco may still be installing).");
                return;
            }

            // Standalone context, mirroring Umbraco.AI.Agent's pattern: avoids the EFCoreScope-pooled contexts
            // whose NPoco-shared connections trigger NREs in SqliteDatabaseCreator on cold-start migrations.
            var optionsBuilder = new DbContextOptionsBuilder<UmbracoCommunityAIChatbotDbContext>();
            UmbracoCommunityAIChatbotDbContext.ConfigureProvider(optionsBuilder, connectionString, providerName);
            optionsBuilder.ConfigureWarnings(w => w.Log(RelationalEventId.PendingModelChangesWarning));

            await using var dbContext = new UmbracoCommunityAIChatbotDbContext(optionsBuilder.Options);

            var pending = await dbContext.Database.GetPendingMigrationsAsync(cancellationToken);
            if (pending.Any())
            {
                _logger.LogInformation("Applying {Count} Chatbot migration(s)...", pending.Count());
                await dbContext.Database.MigrateAsync(cancellationToken);
            }

            await SeedDemoInstanceIfRequestedAsync(dbContext, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to run Umbraco.Community.AI.Chatbot database migrations.");
            throw;
        }
    }

    /// <summary>
    /// One-time seed. If <c>Umbraco:Community:Chatbot:DemoAgentAlias</c> is set in config and no
    /// instances exist yet, inserts a single instance with alias <c>"demo"</c> wired to that agent.
    /// Lets you smoke-test the package without a backoffice UI.
    /// </summary>
    private async Task SeedDemoInstanceIfRequestedAsync(
        UmbracoCommunityAIChatbotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var demoAgentAlias = _configuration["Umbraco:Community:Chatbot:DemoAgentAlias"];
        if (string.IsNullOrWhiteSpace(demoAgentAlias))
        {
            return;
        }

        if (await dbContext.ChatInstances.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        dbContext.ChatInstances.Add(new ChatInstanceEntity
        {
            Id = Guid.NewGuid(),
            Alias = "demo",
            AgentAlias = demoAgentAlias,
            WelcomeMessage = "Hi! Ask me anything about this site.",
            FallbackMessage = "I can only answer based on this site's content. I couldn't find anything about that here.",
            TopK = 5,
            Enabled = true,
            DateCreated = now,
            DateModified = now,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo Chatbot instance pointing at agent alias '{Alias}'.", demoAgentAlias);
    }
}
