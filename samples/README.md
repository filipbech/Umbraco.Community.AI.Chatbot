# Samples

Local "clone, F5, try it" sample site. The actual `DemoSite/` is **not committed** so users don't end up running each other's seed data, but the one-shot setup below mirrors what the upstream `Umbraco.AI` repo does.

## Create a sample DemoSite

From the repo root:

```bash
# 1. Build the chatbot's frontend (widget.js + backoffice extensions)
cd src/Umbraco.Community.AI.Chatbot.Web.StaticAssets/Client
npm install
npm run build
cd -

# 2. Scaffold an Umbraco 17 site with the unattended-install settings baked in
dotnet new umbraco -n DemoSite -o samples/DemoSite \
    --friendly-name "Admin" --email admin@example.com --password password1234 \
    --development-database-type SQLite

cd samples/DemoSite

# 3. Reference the chatbot meta-package — brings the chatbot's own composer + widget,
#    plus the Umbraco.AI Connections + Agent backoffice UI transitively.
dotnet add reference ../../src/Umbraco.Community.AI.Chatbot/Umbraco.Community.AI.Chatbot.csproj

# 4. Optional — content + AI suite to actually exercise the chatbot
dotnet add package Clean                      # Umbraco's "Clean" starter kit (seed content)
dotnet add package Umbraco.AI.OpenAI          # provider (pick whichever you have a key for)
dotnet add package Umbraco.AI.Mistral         # another provider, optional
dotnet add package Umbraco.AI.Search.Startup  # adds the AI Search backoffice
```

## Run it

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run \
    --no-launch-profile \
    --urls="https://localhost:44390;http://localhost:5117"
```

`ASPNETCORE_ENVIRONMENT=Development` is required so `appsettings.Development.json` (which holds the unattended-install settings) gets loaded — without it the site boots into Production and never installs.

Once it's up:

- https://localhost:44390/umbraco — backoffice (`admin@example.com` / `password1234`)
- https://localhost:44390/ — the public site, served by Clean

## Configure the chatbot in the backoffice

1. **AI → Connections** — add an OpenAI / DeepSeek / etc. connection with your key.
2. **AI → Agents** — create an agent. Its `Instructions` field is the persona/tone.
3. **AI → Search** — create an index over the Clean content.
4. **AI → Add-ons → Chatbot** — create an instance, pick the agent, give it an alias (e.g. `default`).

Then drop the widget script into one of Clean's templates (e.g. `Views/_layout.cshtml`):

```html
<script type="module"
        src="/App_Plugins/UmbracoCommunityAIChatbot/widget.js"
        data-instance="default"></script>
```

Republish a content node and visit a public page — the bubble appears bottom-right.

## Notes

- The `samples/DemoSite/` folder is gitignored.
- The package csprojs default to `UseProjectReferences=false`, so consumers and CI use the published NuGet packages. To work against sibling clones of `Umbraco.AI`, `Umbraco.AI.Agent`, and `Umbraco.AI.Search` instead, pass `-p:UseProjectReferences=true`.
