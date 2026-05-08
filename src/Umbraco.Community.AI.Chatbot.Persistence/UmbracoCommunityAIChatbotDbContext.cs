using Microsoft.EntityFrameworkCore;
using Umbraco.Community.AI.Chatbot.Persistence.ChatInstances;

namespace Umbraco.Community.AI.Chatbot.Persistence;

public class UmbracoCommunityAIChatbotDbContext : DbContext
{
    internal DbSet<ChatInstanceEntity> ChatInstances { get; set; } = null!;

    public UmbracoCommunityAIChatbotDbContext(DbContextOptions<UmbracoCommunityAIChatbotDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Per-package migrations history table. Keeps schema housekeeping isolated from Umbraco's own.
    /// </summary>
    internal const string MigrationsHistoryTableName = "__EFMigrationsHistory_UmbracoCommunityAIChatbot";

    internal const string SqlServerProvider = "Microsoft.Data.SqlClient";
    internal const string SqliteProvider = "Microsoft.Data.Sqlite";

    internal static void ConfigureProvider(
        DbContextOptionsBuilder options,
        string? connectionString,
        string? providerName)
    {
        if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(providerName))
        {
            return;
        }

        switch (providerName)
        {
            case SqlServerProvider:
            case "System.Data.SqlClient":
                options.UseSqlServer(connectionString, x =>
                {
                    x.MigrationsAssembly("Umbraco.Community.AI.Chatbot.Persistence.SqlServer");
                    x.MigrationsHistoryTable(MigrationsHistoryTableName);
                });
                break;

            case SqliteProvider:
            case "Microsoft.Data.SQLite":
                options.UseSqlite(connectionString, x =>
                {
                    x.MigrationsAssembly("Umbraco.Community.AI.Chatbot.Persistence.Sqlite");
                    x.MigrationsHistoryTable(MigrationsHistoryTableName);
                });
                break;

            default:
                throw new InvalidOperationException(
                    $"Database provider '{providerName}' is not supported by Umbraco.Community.AI.Chatbot.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ChatInstanceEntity>(entity =>
        {
            entity.ToTable("umbracoCommunityAIChatbot_Instance");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Alias).HasMaxLength(100).IsRequired();
            entity.Property(e => e.AgentAlias).HasMaxLength(100).IsRequired();
            entity.Property(e => e.WelcomeMessage).HasMaxLength(2000);
            entity.Property(e => e.FallbackMessage).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.TopK).IsRequired().HasDefaultValue(5);
            entity.Property(e => e.SuggestionCount).IsRequired().HasDefaultValue(3);
            entity.Property(e => e.Enabled).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.DateCreated).IsRequired();
            entity.Property(e => e.DateModified).IsRequired();

            entity.HasIndex(e => e.Alias).IsUnique();
        });
    }
}
