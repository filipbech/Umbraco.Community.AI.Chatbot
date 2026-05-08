# Samples

This folder is for a local "clone, F5, try it" sample site. The actual `DemoSite/` is **not committed** so users don't end up running each other's seed data, but a one-line setup is below.

## Create a sample DemoSite

From the repo root:

```bash
dotnet new install Umbraco.Templates
dotnet new umbraco -n DemoSite -o samples/DemoSite \
    --friendly-name "Admin" --email admin@example.com --password password1234 \
    --connection-string-type SQLite --development-database-type SQLite
cd samples/DemoSite
dotnet add reference ../../src/Umbraco.Community.AI.Chatbot/Umbraco.Community.AI.Chatbot.csproj
```

Add the widget script to `Views/Master.cshtml`:

```html
<script type="module"
        src="/App_Plugins/UmbracoCommunityAIChatbot/widget.js"
        data-instance="my-chat-alias"></script>
```

Configure an `Umbraco.AI` connection + agent + search index in the backoffice, create a Chatbot instance, and run.

The `samples/DemoSite/` folder is gitignored.
