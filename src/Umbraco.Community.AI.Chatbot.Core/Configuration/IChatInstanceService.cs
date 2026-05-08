namespace Umbraco.Community.AI.Chatbot.Core.Configuration;

/// <summary>
/// Public service for resolving and managing chat instances.
/// </summary>
public interface IChatInstanceService
{
    Task<ChatInstance?> GetInstanceByAliasAsync(string alias, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatInstance>> GetAllInstancesAsync(CancellationToken cancellationToken = default);

    Task<ChatInstance> SaveInstanceAsync(ChatInstance instance, CancellationToken cancellationToken = default);

    Task<bool> DeleteInstanceAsync(Guid id, CancellationToken cancellationToken = default);
}
