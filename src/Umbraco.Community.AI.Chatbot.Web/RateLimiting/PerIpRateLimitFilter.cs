using System.Collections.Concurrent;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Umbraco.Community.AI.Chatbot.Web.RateLimiting;

/// <summary>
/// In-memory per-IP sliding-window rate limit applied as an action filter.
/// Implemented as a filter (rather than ASP.NET's built-in <c>UseRateLimiter</c>) so the package
/// can be installed without the host having to add middleware ordering or DI bootstrap.
/// </summary>
public sealed class PerIpRateLimitFilter : IAsyncActionFilter
{
    private static readonly ConcurrentDictionary<string, ClientWindow> _windows = new();
    private readonly IOptionsMonitor<ChatbotRateLimitOptions> _options;

    public PerIpRateLimitFilter(IOptionsMonitor<ChatbotRateLimitOptions> options)
    {
        _options = options;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var options = _options.CurrentValue;
        if (options.RequestsPerWindow <= 0 || options.WindowSeconds <= 0)
        {
            // Limiter disabled — pass through.
            await next();
            return;
        }

        var ip = ResolveClientIp(context.HttpContext);
        var window = _windows.GetOrAdd(ip, _ => new ClientWindow());
        var now = DateTime.UtcNow;
        var windowSpan = TimeSpan.FromSeconds(options.WindowSeconds);

        if (!window.TryAcquire(now, windowSpan, options.RequestsPerWindow, out var retryAfterSeconds))
        {
            context.HttpContext.Response.Headers.RetryAfter = retryAfterSeconds.ToString();
            context.Result = new ObjectResult(new ProblemDetails
            {
                Title = "Too many requests.",
                Detail = $"Try again in {retryAfterSeconds}s.",
                Status = StatusCodes.Status429TooManyRequests,
            })
            {
                StatusCode = StatusCodes.Status429TooManyRequests,
            };
            return;
        }

        await next();
    }

    private static string ResolveClientIp(HttpContext context)
    {
        // X-Forwarded-For takes precedence so reverse proxies don't collapse every visitor onto
        // the proxy's IP. Trust the leftmost entry. Hosts that don't run behind a proxy will
        // still get the real connection IP via Connection.RemoteIpAddress.
        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var fwd))
        {
            var first = fwd.ToString().Split(',', 2)[0].Trim();
            if (!string.IsNullOrEmpty(first))
            {
                return first;
            }
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    /// <summary>Tracks request timestamps for one client IP. Thread-safe.</summary>
    private sealed class ClientWindow
    {
        private readonly Queue<DateTime> _timestamps = new();
        private readonly object _gate = new();

        public bool TryAcquire(DateTime now, TimeSpan window, int maxRequests, out int retryAfterSeconds)
        {
            lock (_gate)
            {
                var cutoff = now - window;
                while (_timestamps.Count > 0 && _timestamps.Peek() < cutoff)
                {
                    _timestamps.Dequeue();
                }

                if (_timestamps.Count >= maxRequests)
                {
                    var oldest = _timestamps.Peek();
                    var freeAt = oldest + window;
                    retryAfterSeconds = Math.Max(1, (int)Math.Ceiling((freeAt - now).TotalSeconds));
                    return false;
                }

                _timestamps.Enqueue(now);
                retryAfterSeconds = 0;
                return true;
            }
        }
    }
}
