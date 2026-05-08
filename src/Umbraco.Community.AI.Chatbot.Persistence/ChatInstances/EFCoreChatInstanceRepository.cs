using Microsoft.EntityFrameworkCore;
using Umbraco.Cms.Persistence.EFCore.Scoping;
using Umbraco.Community.AI.Chatbot.Core.Configuration;

namespace Umbraco.Community.AI.Chatbot.Persistence.ChatInstances;

internal sealed class EFCoreChatInstanceRepository : IChatInstanceRepository
{
    private readonly IEFCoreScopeProvider<UmbracoCommunityAIChatbotDbContext> _scopeProvider;

    public EFCoreChatInstanceRepository(IEFCoreScopeProvider<UmbracoCommunityAIChatbotDbContext> scopeProvider)
    {
        _scopeProvider = scopeProvider;
    }

    public async Task<ChatInstance?> GetByAliasAsync(string alias, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeProvider.CreateScope();

        var entity = await scope.ExecuteWithContextAsync(async db =>
            await db.ChatInstances.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Alias.ToLower() == alias.ToLower(), cancellationToken));

        scope.Complete();

        return entity is null ? null : ChatInstanceEntityFactory.BuildDomain(entity);
    }

    public async Task<IReadOnlyList<ChatInstance>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeProvider.CreateScope();

        var entities = await scope.ExecuteWithContextAsync(async db =>
            await db.ChatInstances.AsNoTracking().OrderBy(e => e.Alias).ToListAsync(cancellationToken));

        scope.Complete();

        return entities.Select(ChatInstanceEntityFactory.BuildDomain).ToList();
    }

    public async Task<ChatInstance> SaveAsync(ChatInstance instance, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeProvider.CreateScope();

        var saved = await scope.ExecuteWithContextAsync(async db =>
        {
            var existing = await db.ChatInstances.FirstOrDefaultAsync(e => e.Id == instance.Id, cancellationToken);
            if (existing is null)
            {
                db.ChatInstances.Add(ChatInstanceEntityFactory.BuildEntity(instance));
            }
            else
            {
                ChatInstanceEntityFactory.UpdateEntity(existing, instance);
            }
            await db.SaveChangesAsync(cancellationToken);
            return instance;
        });

        scope.Complete();

        return saved;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeProvider.CreateScope();

        var deleted = await scope.ExecuteWithContextAsync(async db =>
        {
            var entity = await db.ChatInstances.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
            if (entity is null)
            {
                return false;
            }
            db.ChatInstances.Remove(entity);
            await db.SaveChangesAsync(cancellationToken);
            return true;
        });

        scope.Complete();

        return deleted;
    }
}
