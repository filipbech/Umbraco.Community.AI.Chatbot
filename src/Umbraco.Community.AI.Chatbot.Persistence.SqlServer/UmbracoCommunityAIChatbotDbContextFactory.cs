using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Umbraco.Community.AI.Chatbot.Persistence.SqlServer;

public class UmbracoCommunityAIChatbotDbContextFactory : IDesignTimeDbContextFactory<UmbracoCommunityAIChatbotDbContext>
{
    public UmbracoCommunityAIChatbotDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<UmbracoCommunityAIChatbotDbContext>();

        optionsBuilder.UseSqlServer(
            "Server=.;Database=UmbracoCommunityAIChatbot_Design;Integrated Security=true;TrustServerCertificate=true",
            x =>
            {
                x.MigrationsAssembly(typeof(UmbracoCommunityAIChatbotDbContextFactory).Assembly.FullName);
                x.MigrationsHistoryTable(UmbracoCommunityAIChatbotDbContext.MigrationsHistoryTableName);
            });

        return new UmbracoCommunityAIChatbotDbContext(optionsBuilder.Options);
    }
}
