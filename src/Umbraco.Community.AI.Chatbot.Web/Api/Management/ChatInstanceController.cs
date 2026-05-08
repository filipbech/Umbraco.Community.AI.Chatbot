using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.AI.Web.Authorization;
using Umbraco.Community.AI.Chatbot.Core.Configuration;

namespace Umbraco.Community.AI.Chatbot.Web.Api.Management;

[ApiController]
[Authorize(Policy = AIAuthorizationPolicies.SectionAccessAI)]
[Route("umbraco/community/chatbot/management/api/v1/instances")]
public sealed class ChatInstanceController : ControllerBase
{
    private readonly IChatInstanceService _service;

    public ChatInstanceController(IChatInstanceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ChatInstanceResponseModel>>> GetAll(CancellationToken cancellationToken)
    {
        var instances = await _service.GetAllInstancesAsync(cancellationToken);
        return Ok(instances.Select(ToResponse).ToList());
    }

    [HttpGet("{alias}")]
    public async Task<ActionResult<ChatInstanceResponseModel>> GetByAlias(string alias, CancellationToken cancellationToken)
    {
        var instance = await _service.GetInstanceByAliasAsync(alias, cancellationToken);
        return instance is null ? NotFound() : Ok(ToResponse(instance));
    }

    [HttpPost]
    public async Task<ActionResult<ChatInstanceResponseModel>> Create([FromBody] CreateOrUpdateChatInstanceRequestModel model, CancellationToken cancellationToken)
    {
        var existing = await _service.GetInstanceByAliasAsync(model.Alias, cancellationToken);
        if (existing is not null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Alias already exists",
                Detail = $"A chat instance with alias '{model.Alias}' already exists.",
                Status = StatusCodes.Status409Conflict,
            });
        }

        var instance = ApplyToDomain(new ChatInstance(), model);
        var saved = await _service.SaveInstanceAsync(instance, cancellationToken);
        return CreatedAtAction(nameof(GetByAlias), new { alias = saved.Alias }, ToResponse(saved));
    }

    [HttpPut("{alias}")]
    public async Task<ActionResult<ChatInstanceResponseModel>> Update(string alias, [FromBody] CreateOrUpdateChatInstanceRequestModel model, CancellationToken cancellationToken)
    {
        var existing = await _service.GetInstanceByAliasAsync(alias, cancellationToken);
        if (existing is null)
        {
            return NotFound();
        }

        // If the alias is changing, make sure the new one is free.
        if (!string.Equals(model.Alias, existing.Alias, StringComparison.OrdinalIgnoreCase))
        {
            var clash = await _service.GetInstanceByAliasAsync(model.Alias, cancellationToken);
            if (clash is not null)
            {
                return Conflict(new ProblemDetails
                {
                    Title = "Alias already exists",
                    Detail = $"A chat instance with alias '{model.Alias}' already exists.",
                    Status = StatusCodes.Status409Conflict,
                });
            }
        }

        ApplyToDomain(existing, model);
        var saved = await _service.SaveInstanceAsync(existing, cancellationToken);
        return Ok(ToResponse(saved));
    }

    [HttpDelete("{alias}")]
    public async Task<IActionResult> Delete(string alias, CancellationToken cancellationToken)
    {
        var existing = await _service.GetInstanceByAliasAsync(alias, cancellationToken);
        if (existing is null)
        {
            return NotFound();
        }

        var deleted = await _service.DeleteInstanceAsync(existing.Id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private static ChatInstanceResponseModel ToResponse(ChatInstance instance) => new()
    {
        Id = instance.Id,
        Name = instance.Name,
        Alias = instance.Alias,
        AgentAlias = instance.AgentAlias,
        WelcomeMessage = instance.WelcomeMessage,
        FallbackMessage = instance.FallbackMessage,
        TopK = instance.TopK,
        SuggestionCount = instance.SuggestionCount,
        Enabled = instance.Enabled,
        DateCreated = instance.DateCreated,
        DateModified = instance.DateModified,
    };

    private static ChatInstance ApplyToDomain(ChatInstance instance, CreateOrUpdateChatInstanceRequestModel model)
    {
        instance.Name = model.Name;
        instance.Alias = model.Alias;
        instance.AgentAlias = model.AgentAlias;
        instance.WelcomeMessage = model.WelcomeMessage;
        instance.FallbackMessage = model.FallbackMessage;
        instance.TopK = model.TopK;
        instance.SuggestionCount = model.SuggestionCount;
        instance.Enabled = model.Enabled;
        return instance;
    }
}
