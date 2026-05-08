using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.AI.Agent.Core.Agents;
using Umbraco.Community.AI.Chatbot.Core.Chat;
using Umbraco.Community.AI.Chatbot.Core.Configuration;
using Umbraco.Community.AI.Chatbot.Web.RateLimiting;

namespace Umbraco.Community.AI.Chatbot.Web.Api.Public;

[ApiController]
[AllowAnonymous]
[Route("umbraco/community/chatbot/api/v1")]
public sealed class ChatController : ControllerBase
{
    private readonly IChatInstanceService _chatInstanceService;
    private readonly IAIAgentService _agentService;
    private readonly IChatOrchestrator _orchestrator;

    public ChatController(
        IChatInstanceService chatInstanceService,
        IAIAgentService agentService,
        IChatOrchestrator orchestrator)
    {
        _chatInstanceService = chatInstanceService;
        _agentService = agentService;
        _orchestrator = orchestrator;
    }

    /// <summary>
    /// Returns the public-facing config the widget needs to render itself
    /// (title, welcome message). Anonymous: only returns enabled instances.
    /// </summary>
    [HttpGet("instances/{alias}/config")]
    public async Task<IActionResult> GetConfig(string alias, CancellationToken cancellationToken)
    {
        var instance = await _chatInstanceService.GetInstanceByAliasAsync(alias, cancellationToken);
        if (instance is null || !instance.Enabled)
        {
            return NotFound();
        }

        return Ok(new ChatInstanceConfigModel
        {
            Alias = instance.Alias,
            Name = instance.Name,
            WelcomeMessage = instance.WelcomeMessage,
        });
    }

    [HttpPost("chat")]
    [Produces("text/event-stream")]
    [ServiceFilter(typeof(PerIpRateLimitFilter))]
    public async Task<IResult> Chat([FromBody] ChatRequestModel request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.InstanceAlias))
        {
            return Results.BadRequest(new ProblemDetails
            {
                Title = "InstanceAlias is required.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        var instance = await _chatInstanceService.GetInstanceByAliasAsync(request.InstanceAlias, cancellationToken);
        if (instance is null || !instance.Enabled)
        {
            return Results.NotFound(new ProblemDetails
            {
                Title = "Chat instance not found.",
                Detail = $"No enabled chat instance with alias '{request.InstanceAlias}'.",
                Status = StatusCodes.Status404NotFound,
            });
        }

        // Surface a friendly error if the configured agent is missing or deactivated rather than
        // letting StreamAgentAsync throw "Agent with alias 'x' not found." mid-stream.
        var agent = await _agentService.GetAgentByAliasAsync(instance.AgentAlias, cancellationToken);
        if (agent is null || !agent.IsActive)
        {
            return Results.Json(
                new ProblemDetails
                {
                    Title = "Chat is temporarily unavailable.",
                    Detail = agent is null
                        ? $"The configured agent '{instance.AgentAlias}' could not be found."
                        : $"The configured agent '{instance.AgentAlias}' is currently deactivated.",
                    Status = StatusCodes.Status503ServiceUnavailable,
                },
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var conversation = (request.Messages ?? [])
            .Where(m => !string.IsNullOrWhiteSpace(m.Content))
            .Select(m => new ChatTurn(m.Role, m.Content))
            .ToList();

        if (conversation.Count == 0)
        {
            return Results.BadRequest(new ProblemDetails
            {
                Title = "At least one user message is required.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        var stream = _orchestrator.RunAsync(instance, conversation, cancellationToken);
        return new SseChatStreamResult(stream);
    }
}
