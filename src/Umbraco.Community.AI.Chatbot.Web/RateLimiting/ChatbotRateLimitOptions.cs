namespace Umbraco.Community.AI.Chatbot.Web.RateLimiting;

/// <summary>
/// Per-IP sliding-window rate limit applied to the public chat endpoint.
/// The endpoint is anonymous and LLM-backed, so by default we ship strict limits.
/// </summary>
/// <remarks>
/// Bound from configuration at <c>Umbraco:Community:Chatbot:RateLimit</c>.
/// Set <see cref="RequestsPerWindow"/> to 0 to disable.
/// </remarks>
public sealed class ChatbotRateLimitOptions
{
    public const string ConfigPath = "Umbraco:Community:Chatbot:RateLimit";

    /// <summary>Number of chat requests allowed per IP within the window. 0 disables the limiter.</summary>
    public int RequestsPerWindow { get; set; } = 30;

    /// <summary>Window length in seconds.</summary>
    public int WindowSeconds { get; set; } = 300;
}
