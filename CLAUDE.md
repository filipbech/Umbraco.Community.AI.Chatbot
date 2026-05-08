# CLAUDE.md

Guidance for Claude Code working in this repository. Read this first on every session — it captures decisions and context that aren't recoverable from the source alone.

## What this is

`Umbraco.Community.AI.Chatbot` is a community Umbraco package that drops a public-facing, AI-powered chat widget onto a website. End-users on the public site type a question; the package does a semantic search over the site's Umbraco content (`Umbraco.AI.Search`), feeds the matched pages into an AI agent (`Umbraco.AI.Agent`), and streams a grounded answer back with cited source pages and follow-up suggestions.

The official `Umbraco.AI.*` packages expose chat only inside the backoffice. There is no path for an anonymous site visitor to ask questions of the site's content. This package fills that gap as a **community** package (separate repo, `Umbraco.Community.AI.*` namespace) so it isn't held to the same support/release cadence as the official suite.

## Architecture

```
Website visitor
   │ POST /umbraco/community/chatbot/api/v1/chat   (anonymous, SSE)
   ▼
ChatController       — rate limit + agent-active check
   ▼
ChatOrchestrator
   ├── ISearcher (AIVectorSearcher)  → top-K matched documents
   ├── ContentResolver               → IPublishedContent → title, URL, body text
   ├── GroundingPromptBuilder        → strict "answer ONLY from sources" prompt
   ├── IAIAgentService.StreamAgentAsync → streamed answer (uses agent's Instructions)
   └── FollowUpGenerator             → suggested follow-up questions
   ▼
SSE: sources → delta* → suggestions → done   (or error → done)
```

Plus a public config endpoint `GET /instances/{alias}/config` that returns `{alias, name, welcomeMessage}` so the widget can render itself before the first message.

## Project layout

Mirrors the official Umbraco.AI add-on shape.

```
Umbraco.Community.AI.Chatbot/
├── src/
│   ├── Umbraco.Community.AI.Chatbot.Core/                 # domain + services
│   │   ├── Configuration/  ChatInstance, IChatInstanceService, IChatInstanceRepository
│   │   ├── Chat/           ChatOrchestrator, GroundingPromptBuilder, FollowUpGenerator
│   │   ├── Search/         IContentResolver, ContentResolver, ResolvedSource
│   │   └── Members/        IChatPrincipalAccessor (anonymous default)
│   ├── Umbraco.Community.AI.Chatbot.Web/                  # Management API + public API
│   │   ├── Api/Public/         ChatController (anonymous), config endpoint, SSE stream result
│   │   ├── Api/Management/     ChatInstanceController (auth-gated)
│   │   ├── RateLimiting/       PerIpRateLimitFilter, AgentChatRateLimitOptions
│   │   └── Configuration/      AddChatbotWeb extension
│   ├── Umbraco.Community.AI.Chatbot.Web.StaticAssets/     # frontend
│   │   ├── Client/             Lit + Vite source (npm workspace)
│   │   │   ├── src/chatbot/    backoffice extensions (Connections-style)
│   │   │   └── src/widget/     public chat widget bundle
│   │   └── wwwroot/App_Plugins/UmbracoCommunityAIChatbot/  # built output (gitignored)
│   ├── Umbraco.Community.AI.Chatbot.Persistence/          # EF Core
│   ├── Umbraco.Community.AI.Chatbot.Persistence.SqlServer/  # SQL Server migrations
│   ├── Umbraco.Community.AI.Chatbot.Persistence.Sqlite/     # SQLite migrations
│   ├── Umbraco.Community.AI.Chatbot.Startup/              # IComposer wiring
│   └── Umbraco.Community.AI.Chatbot/                      # meta-package
├── tests/Umbraco.Community.AI.Chatbot.Tests.Unit/         # xUnit + Shouldly + Moq
├── samples/DemoSite/                                       # local-only smoke test (gitignored or sample-only)
├── Umbraco.Community.AI.Chatbot.slnx
└── README.md
```

**Migration prefix:** `UmbracoCommunityAIChatbot_` (drop dots from the package id).
**DB table:** `umbracoCommunityAIChatbot_Instance`.
**EF history table:** `__EFMigrationsHistory_UmbracoCommunityAIChatbot` (per-package isolated).

## Frontend layout (Connections-pattern)

The backoffice UI mirrors the **Connections** module in `Umbraco.AI/src/Umbraco.AI.Web.StaticAssets/Client/src/connection/`. When changing the UI, that's the reference implementation to study.

```
Client/src/chatbot/
├── constants.ts, entity.ts, types.ts, type-mapper.ts, manifests.ts (barrel)
├── menu/manifests.ts                # entityContainer menu under AI → Add-ons
├── repository/
│   ├── detail/                       # extends UmbDetailRepositoryBase + store
│   └── collection/                   # implements UmbCollectionRepository
├── collection/
│   ├── chatinstance-collection.element.ts            # extends UmbCollectionDefaultElement
│   ├── views/table/                  # custom table view, allowSelection: true
│   ├── action/                       # "Create" collection action
│   └── bulk-action/                  # bulk-delete action
├── workspace/
│   ├── chatinstance-root/            # default workspace + collection workspaceView
│   └── chatinstance/                 # routable workspace (create / edit/:unique) + Settings view + Save action
├── entity-actions/                   # Delete entity action (shows in workspace action menu)
├── agents/agent-options.repository.ts # fetch agents via /umbraco/ai/management/api/v1/agents
└── components/status-selector.element.ts # Active/Inactive segmented control
```

## Naming conventions

- **Manifest aliases:** `Ucai.<Kind>.<Entity>` — e.g. `Ucai.Workspace.ChatInstance`, `Ucai.MenuItem.Chatbot`, `Ucai.Repository.ChatInstance.Detail`
- **Constants:** `UCAI_<DOMAIN>_<NAME>` — e.g. `UCAI_CHATINSTANCE_ENTITY_TYPE`, `UCAI_CHATBOT_ICON`
- **Custom elements:** `ucai-<kebab-case>` — e.g. `ucai-chatinstance-collection`, `ucai-chatbot-widget`
- **TS classes:** `Ucai<PascalCase>` — e.g. `UcaiChatInstanceWorkspaceContext`
- **Backend types:** plain (no prefix) — `ChatInstance`, `ChatOrchestrator`, `ChatInstanceController`
- **Entity type strings:** `ucai:chatinstance`, `ucai:chatinstance-root`
- **Migration class names:** `UmbracoCommunityAIChatbot_<Verb>` — e.g. `UmbracoCommunityAIChatbot_Initial`

## Key decisions (don't re-litigate without reason)

These are the things that look re-debatable but were thought through. Read before changing.

- **`unique` = alias, not GUID id.** The management API uses alias as its natural key (PUT/DELETE by alias), so the workspace `unique` matches that. Trade-off: changing the alias changes the URL — accepted because alias should be stable post-create (input is read-only after isNew).
- **Persona lives on the agent's `Instructions`, not on our prompt.** `GroundingPromptBuilder` only owns the `RULES` block + the source list. The agent's `ChatOptions.Instructions` (set in the Agent backoffice) is the persona/tone layer. Both get sent to the model — they don't fight because they have distinct jobs.
- **Suggestions are a second-pass call, not part of the main stream.** Cheaper and simpler than reusing the streaming path. Configurable 0–5; **0 short-circuits the call entirely** (no roundtrip).
- **Agent dropdown filters by `isActive`** — but the public `ChatController` *also* re-checks `agent.IsActive` and returns 503 if it flipped between save and request.
- **Rate limiter is an action filter, not `UseRateLimiter` middleware**, so the package can be installed without the host having to wire middleware ordering. In-memory sliding window per IP. Honors `X-Forwarded-For`. Default 30 req / 5 min, set `RequestsPerWindow=0` to disable.
- **Request size caps at the model layer**: `MaxMessages=50`, `MaxContentLength=4000`. `[MaxLength]` + `[StringLength]`. Too big returns 400 before any LLM call.
- **Markdown rendering uses `marked` + `unsafeHTML`** with no sanitiser. Acceptable today because the model is grounded in your published content. If sites start indexing user-generated text (comments etc.), pipe through `DOMPurify` first.
- **Member-protected content is not handled.** `IChatPrincipalAccessor` is wired but ships an anonymous-only implementation. README/SECURITY.md document this. The supported mitigation is "don't index member-only content" until a Member-aware accessor lands.
- **Reflection-based block extraction in `ContentResolver.AppendValue`.** The fallback `try/catch` exists because generic `BlockListItem<TContent>` exposes multiple `Content` properties (declared + inherited) and `GetProperty("Content")` throws `AmbiguousMatchException`. We pick the one whose type implements `IPublishedElement`. Logged at Trace.

## Build / test / dev loop

```bash
# .NET
dotnet build Umbraco.Community.AI.Chatbot.slnx
dotnet test  Umbraco.Community.AI.Chatbot.slnx

# Frontend (from src/Umbraco.Community.AI.Chatbot.Web.StaticAssets/Client)
npm install
npm run build       # one-shot
npm run watch       # dev loop

# Migrations (from repo root)
dotnet ef migrations add UmbracoCommunityAIChatbot_<Name> \
    -p src/Umbraco.Community.AI.Chatbot.Persistence.Sqlite \
    -c UmbracoCommunityAIChatbotDbContext \
    --output-dir Migrations
dotnet ef migrations add UmbracoCommunityAIChatbot_<Name> \
    -p src/Umbraco.Community.AI.Chatbot.Persistence.SqlServer \
    -c UmbracoCommunityAIChatbotDbContext \
    --output-dir Migrations
```

To smoke-test against a real Umbraco site, install a sample Umbraco site under `samples/DemoSite/` and add project references to the meta-package. Or — once published — `dotnet add package Umbraco.Community.AI.Chatbot` in any Umbraco 17.3+ project that already has `Umbraco.AI`, `Umbraco.AI.Agent`, and `Umbraco.AI.Search`.

## Versioning & releases

- Single `<Version>` in `Directory.Build.props` (currently `0.1.0`).
- SemVer. Bump as you release: 0.x while pre-1.0, then 1.0+ with API stability commitments.
- CI workflow at `.github/workflows/build.yml` runs build + test on PR; pack + push to NuGet.org on `v*` tag.

## What's deliberately NOT in MVP

Document in README under "follow-ups", and don't add unless someone asks:

- Multi-instance scoping by content sub-tree
- Member-aware content filtering implementation (the abstraction is there)
- Server-side conversation persistence / analytics
- SignalR (we use SSE — simpler, sufficient for one-way streaming)
- CORS / cross-origin embedding
- Per-instance prompt overrides beyond fallback message + suggestion count

## Known smells / pre-publish punch list

Items to address before / after first publish, in roughly priority order:

1. **Widget z-index isn't set explicitly.** Cookie banners and sticky headers can overlap. Add `z-index: 2147483000` and a `data-z-index` override.
2. **Bulk delete is sequential.** N requests for N items. Fine for the realistic case (≤5 instances), but a server-side batch delete would be cleaner.
3. **Agent picker doesn't filter by `isActive` on the server.** Client could pass `?isActive=true`; today it filters in the dropdown render but fetches everything.
4. **`ContentResolver.MaxBodyCharsPerSource = 4000`** is hardcoded. Could be per-instance config later.
5. **No tests for `ChatOrchestrator` happy path.** `GroundingPromptBuilder` and `FollowUpGenerator.ParseSuggestions` are covered (13 tests). An integration-style test with mocked `IAIAgentService` + `IContentResolver` would catch SSE-event ordering regressions.
6. **No SECURITY.md disclosure email** beyond the placeholder — confirm the email address before publish.

## Behaviour rules for Claude in this repo

- **Stay terse.** This package values short comments that explain *why*, not what. Don't add docstrings to obvious code. Match the existing comment density.
- **Mirror Connections.** When adding new backoffice UI, pattern-match against `connection/` in the Umbraco.AI repo. Don't invent a new convention.
- **Don't bypass the layered structure.** Repositories are internal to their service; controllers/UI go through the service layer.
- **Confirm before destructive actions.** Especially: dropping migrations, force-pushing, blowing away the dev SQLite DB. The pre-1.0 phase makes some of those tempting — still confirm with the user.
- **When prompts change**, re-run the test suite. The grounding prompt has tests asserting the load-bearing rules ("Answer ONLY", "Do not fabricate URLs"). If those fail it's a regression, not a test to update.
- **API and DB schema changes** require an EF migration in *both* SqlServer and Sqlite projects, in lockstep.
