namespace Umbraco.Community.AI.Chatbot.Core.Configuration;

/// <summary>
/// Repository abstraction. Internal — only <see cref="IChatInstanceService"/> calls into this.
/// </summary>
internal interface IChatInstanceRepository
{
    Task<ChatInstance?> GetByAliasAsync(string alias, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatInstance>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<ChatInstance> SaveAsync(ChatInstance instance, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
