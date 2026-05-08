namespace Umbraco.Community.AI.Chatbot.Core.Configuration;

internal sealed class ChatInstanceService : IChatInstanceService
{
    private readonly IChatInstanceRepository _repository;

    public ChatInstanceService(IChatInstanceRepository repository)
    {
        _repository = repository;
    }

    public Task<ChatInstance?> GetInstanceByAliasAsync(string alias, CancellationToken cancellationToken = default)
        => _repository.GetByAliasAsync(alias, cancellationToken);

    public Task<IReadOnlyList<ChatInstance>> GetAllInstancesAsync(CancellationToken cancellationToken = default)
        => _repository.GetAllAsync(cancellationToken);

    public Task<ChatInstance> SaveInstanceAsync(ChatInstance instance, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(instance.Alias))
        {
            throw new ArgumentException("ChatInstance.Alias is required.", nameof(instance));
        }
        if (string.IsNullOrWhiteSpace(instance.AgentAlias))
        {
            throw new ArgumentException("ChatInstance.AgentAlias is required.", nameof(instance));
        }
        if (instance.TopK <= 0)
        {
            instance.TopK = 5;
        }
        if (instance.Id == Guid.Empty)
        {
            instance.Id = Guid.NewGuid();
            instance.DateCreated = DateTime.UtcNow;
        }
        instance.DateModified = DateTime.UtcNow;

        return _repository.SaveAsync(instance, cancellationToken);
    }

    public Task<bool> DeleteInstanceAsync(Guid id, CancellationToken cancellationToken = default)
        => _repository.DeleteAsync(id, cancellationToken);
}
