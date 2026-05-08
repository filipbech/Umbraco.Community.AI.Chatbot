# Chatbot

> NuGet package id: `Umbraco.Community.AI.Chatbot`

A community Umbraco package that exposes a public-facing, AI-powered chat widget on a website's frontend. Visitors ask questions in natural language; the package runs a semantic search over your site's content (`Umbraco.AI.Search`), feeds matched pages into an `Umbraco.AI.Agent`, and streams a grounded answer back with cited source pages and follow-up suggestions.

## Requirements

- Umbraco CMS 17.3+
- `Umbraco.AI` 1.10+
- `Umbraco.AI.Agent` 1.9+ — at least one configured Agent
- `Umbraco.AI.Search` — a populated index over your site's content

## A note on prerelease dependencies

This 1.0.0 stable release transitively depends on two packages that are still in beta upstream:

- `Umbraco.Cms.Search.Core` (1.0.0-beta.x)
- `Umbraco.AI.Search.Core` (1.0.0-beta.x)

NuGet doesn't pull prerelease versions into stable consumers by default. If `dotnet add package Umbraco.Community.AI.Chatbot` errors with *"requires a prerelease dependency"*, run it with the `--prerelease` flag, or pin a floating prerelease floor in your csproj:

```xml
<PackageReference Include="Umbraco.Community.AI.Chatbot" Version="1.0.0" />
<PackageReference Include="Umbraco.Cms.Search.Core" Version="1.0.0-*" />
<PackageReference Include="Umbraco.AI.Search.Core" Version="1.0.0-*" />
```

This restriction will go away once the upstream Search packages ship stable; we'll bump the floors here without a major version of our own.

## Quickstart

1. **Install the NuGet package** in your Umbraco site project.
2. **Build the search index** under *Settings → Search*. The chat package queries whichever index `Umbraco.AI.Search` is configured against.
3. **Create an Agent** under *AI → Add-ons → Agents*. Put your brand voice / persona in the agent's **Instructions** field.
4. **Create a Chat Instance** under *AI → Add-ons → Chatbot → Create*. Pick the agent you just made, set a welcome message and a fallback message.
5. **Drop the widget script** into the public layout (e.g. `Views/Master.cshtml`):

   ```html
   <script type="module"
           src="/App_Plugins/UmbracoCommunityAIChatbot/widget.js"
           data-instance="my-chat-alias"></script>
   ```

   Optional attributes:
   - `data-welcome="..."` — overrides the welcome message configured in the backoffice
   - `data-title="..."` — overrides the panel title
   - `data-api-base="..."` — only needed for cross-origin embedding

A floating chat button appears bottom-right on every page that includes the script.

## How it works

```
Website visitor
   │ POST /umbraco/community/chatbot/api/v1/chat   (anonymous, SSE)
   ▼
ChatController  ── rate limit + agent-active check
   ▼
ChatOrchestrator
   ├── ISearcher                 → top-K matched documents
   ├── ContentResolver           → IPublishedContent → title, URL, body text
   ├── GroundingPromptBuilder    → strict "answer ONLY from sources" prompt
   ├── IAIAgentService.StreamAgentAsync → streamed answer (uses agent's Instructions)
   └── FollowUpGenerator         → suggested follow-up questions
   ▼
SSE: sources → delta* → suggestions → done
```

The agent's persona/tone lives on the **agent's Instructions field**. Our orchestrator only owns the grounding rules and the source block — so the two prompts don't fight.

## Configuration

Each chat instance has:

| field             | description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `Name`            | Display name (alias auto-derives from this — connection-style lock)    |
| `Alias`           | URL-safe identifier the public endpoint accepts                        |
| `AgentAlias`      | Pick from a dropdown of configured `Umbraco.AI.Agent` instances        |
| `WelcomeMessage`  | Shown by the widget when a visitor opens the chat                      |
| `FallbackMessage` | Returned verbatim when the search has no relevant content              |
| `Sources per answer` | How many top-ranked pages to inject as grounding context (1–50)     |
| `Follow-up suggestions` | How many suggested questions to generate (0 disables them)       |
| `Status`          | Active / Inactive — disables the public endpoint without deletion       |

Migrations run automatically on application start.

### Rate limit (public endpoint)

The public chat endpoint is anonymous and LLM-backed, so by default we apply a per-IP sliding-window limit of **30 requests / 5 minutes**. Override in `appsettings.json`:

```json
{
  "Umbraco": {
    "Community": {
      "Chatbot": {
        "RateLimit": {
          "RequestsPerWindow": 30,
          "WindowSeconds": 300
        }
      }
    }
  }
}
```

Set `RequestsPerWindow` to `0` to disable. Tighten it on production sites that don't expect heavy traffic — there's no practical reason a single visitor needs more than a handful of chat turns per minute.

Per-request size caps are also enforced: max **50 messages** in the conversation, max **4 000 characters** per message. Exceeding either returns a 400.

## ⚠️ Security caveats — read before deploying

### Anonymous LLM access costs money

Even with the rate limiter on, a determined attacker behind a botnet can still drive up your inference bill. If you have *any* concern about this, put a CDN/WAF in front (Cloudflare Turnstile, AWS WAF rate rules, etc.) and consider a tighter `RequestsPerWindow`.

### Member-protected content

The chat endpoint is anonymous. The package's `IChatPrincipalAccessor` is wired but ships an **anonymous-only** implementation. **If your search index contains member-protected content**, all of it is reachable through the public chat. Until a Member-aware accessor lands, the safe path is to keep member-only documents out of the `UmbAI_Search` index, or build a custom `IChatPrincipalAccessor` that maps the cookie member into the access context.

### XSS posture

The widget renders the model's response through `marked` and `unsafeHTML`. The model is grounded in your own published content, so practical XSS surface is small — but if you index user-generated text (comments, forum posts), pipe model output through `DOMPurify` before rendering or strip HTML tags entirely.

## License

MIT — see [LICENSE](LICENSE).
