using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Umbraco.Community.AI.Chatbot.Persistence.Sqlite;

public class UmbracoCommunityAIChatbotDbContextFactory : IDesignTimeDbContextFactory<UmbracoCommunityAIChatbotDbContext>
{
    public UmbracoCommunityAIChatbotDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<UmbracoCommunityAIChatbotDbContext>();

        optionsBuilder.UseSqlite(
            "Data Source=UmbracoCommunityAIChatbot_Design.db",
            x =>
            {
                x.MigrationsAssembly(typeof(UmbracoCommunityAIChatbotDbContextFactory).Assembly.FullName);
                x.MigrationsHistoryTable(UmbracoCommunityAIChatbotDbContext.MigrationsHistoryTableName);
            });

        return new UmbracoCommunityAIChatbotDbContext(optionsBuilder.Options);
    }
}
