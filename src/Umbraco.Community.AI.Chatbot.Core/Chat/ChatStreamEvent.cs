using Umbraco.Community.AI.Chatbot.Core.Search;

namespace Umbraco.Community.AI.Chatbot.Core.Chat;

/// <summary>
/// Marker for events the orchestrator emits. The Web layer translates each variant into an SSE frame.
/// </summary>
public abstract record ChatStreamEvent;

public sealed record SourcesEvent(IReadOnlyList<ResolvedSource> Sources) : ChatStreamEvent;

public sealed record DeltaEvent(string Text) : ChatStreamEvent;

public sealed record SuggestionsEvent(IReadOnlyList<string> Suggestions) : ChatStreamEvent;

public sealed record DoneEvent : ChatStreamEvent;

public sealed record ErrorEvent(string Message) : ChatStreamEvent;
