// Bootstrap entry for the public chat widget.
//
// Usage on a public page:
//
//   <script type="module" src="/App_Plugins/UmbracoCommunityAIChatbot/widget.js"
//           data-instance="demo"></script>
//
// On load, this script:
//   1. Reads `data-instance` (alias of a configured ChatInstance) and other optional data-attrs.
//   2. Imports the widget custom element so it's registered.
//   3. Inserts the element on the page so the floating button + panel render.
//
// Same-origin assumption: the API path is relative ("/umbraco/community/chatbot/api/v1/chat"),
// so the widget JS must be served from the same host as the Umbraco site. To embed cross-origin
// in a future iteration, accept `data-api-base` and forward it to the element.

import { UcaiChatbotWidgetElement } from "./chatbot-widget.element.js";

const WIDGET_TAG = "ucai-chatbot-widget";
if (!customElements.get(WIDGET_TAG)) {
    customElements.define(WIDGET_TAG, UcaiChatbotWidgetElement);
}

// `document.currentScript` is null inside ES modules. Find ourselves by matching
// `<script src>` against `import.meta.url` so data-attributes still work as documented.
function findOwnScript(): HTMLScriptElement | null {
    const here = import.meta.url;
    const scripts = Array.from(document.scripts) as HTMLScriptElement[];
    return (
        scripts.find((s) => s.src === here) ??
        scripts.find((s) => s.src && here.endsWith(new URL(s.src, location.href).pathname.split("/").pop() ?? "")) ??
        null
    );
}

const script = findOwnScript();
const instanceAlias = script?.dataset.instance;

if (!instanceAlias) {
    // Don't crash the host page — just log so the developer notices.
    console.warn(
        "[Umbraco.Community.AI.Chatbot] widget script is missing data-instance=\"...\". Add it to the <script> tag.",
    );
} else if (document.querySelector(WIDGET_TAG)) {
    // Already on the page (hot reload or duplicate include). Don't add another.
} else {
    const mount = () => {
        const el = document.createElement(WIDGET_TAG) as UcaiChatbotWidgetElement;
        el.instanceAlias = instanceAlias;
        if (script?.dataset.welcome) {
            el.welcomeMessage = script.dataset.welcome;
            el.welcomeFromAttr = true;
        }
        if (script?.dataset.title) {
            el.title = script.dataset.title;
            el.titleFromAttr = true;
        }
        if (script?.dataset.apiBase) el.apiBase = script.dataset.apiBase;
        document.body.appendChild(el);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount, { once: true });
    } else {
        mount();
    }
}
