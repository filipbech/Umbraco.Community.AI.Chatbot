using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Umbraco.Community.AI.Chatbot.Core.Chat;

namespace Umbraco.Community.AI.Chatbot.Web.Api.Public;

/// <summary>
/// Writes the orchestrator's <see cref="ChatStreamEvent"/> stream as SSE frames.
/// Frame format: <c>event: &lt;name&gt;\ndata: &lt;json&gt;\n\n</c>.
/// </summary>
internal sealed class SseChatStreamResult : IResult
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IAsyncEnumerable<ChatStreamEvent> _events;

    public SseChatStreamResult(IAsyncEnumerable<ChatStreamEvent> events)
    {
        _events = events;
    }

    public async Task ExecuteAsync(HttpContext httpContext)
    {
        var response = httpContext.Response;
        var ct = httpContext.RequestAborted;

        response.ContentType = "text/event-stream";
        response.Headers.CacheControl = "no-cache";
        response.Headers.Connection = "keep-alive";
        response.Headers["X-Accel-Buffering"] = "no"; // disable nginx buffering when fronted

        var bufferingFeature = httpContext.Features.Get<IHttpResponseBodyFeature>();
        bufferingFeature?.DisableBuffering();

        await using var writer = new StreamWriter(response.Body, leaveOpen: true);

        try
        {
            await foreach (var evt in _events.WithCancellation(ct))
            {
                if (ct.IsCancellationRequested)
                {
                    break;
                }

                var (name, payload) = ToFrame(evt);
                var json = JsonSerializer.Serialize(payload, JsonOptions);
                await writer.WriteAsync($"event: {name}\ndata: {json}\n\n");
                await writer.FlushAsync(ct);
            }
        }
        catch (OperationCanceledException)
        {
            // client disconnected
        }
        catch (Exception ex)
        {
            var json = JsonSerializer.Serialize(new { message = ex.Message }, JsonOptions);
            await writer.WriteAsync($"event: error\ndata: {json}\n\n");
            await writer.FlushAsync(ct);
        }
    }

    private static (string Name, object Payload) ToFrame(ChatStreamEvent evt) => evt switch
    {
        SourcesEvent s => ("sources", new
        {
            sources = s.Sources.Select(src => new { documentId = src.DocumentId, title = src.Title, url = src.Url }),
        }),
        DeltaEvent d => ("delta", new { text = d.Text }),
        SuggestionsEvent s => ("suggestions", new { suggestions = s.Suggestions }),
        DoneEvent => ("done", new { }),
        ErrorEvent e => ("error", new { message = e.Message }),
        _ => ("unknown", new { }),
    };
}
