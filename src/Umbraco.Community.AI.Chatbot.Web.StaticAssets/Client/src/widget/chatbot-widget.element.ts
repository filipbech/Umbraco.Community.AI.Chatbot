import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { marked } from "marked";

// Inline markdown for streaming token-by-token (no block elements).
// Also: open every parsed link in a new tab with safe rel.
marked.use({
    breaks: true,
    gfm: true,
    renderer: {
        link({ href, title, text }) {
            const t = title ? ` title="${title}"` : "";
            return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
        },
    },
});

function renderMarkdown(text: string): string {
    try {
        return marked.parse(text, { async: false }) as string;
    } catch {
        // Fall back to escaped plain text on any parse error.
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

interface Source {
    documentId: string;
    title: string;
    url: string | null;
}

interface Turn {
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    suggestions?: string[];
}

const HISTORY_KEY = (alias: string) => `ucai.chatbot.history.${alias}`;
const MAX_TURNS = 20;

/**
 * Public-facing chat widget. Renders a floating button bottom-right; clicking it opens a panel
 * with the welcome message and a scrolling transcript. Each user message hits the SSE endpoint
 * at <apiBase>/chat and renders streamed delta tokens, sources (as chips with links), and
 * follow-up suggestions (clickable to send). Conversation history is persisted in localStorage
 * keyed by instance alias, capped at MAX_TURNS most recent turns.
 */
export class UcaiChatbotWidgetElement extends LitElement {
    @property({ type: String }) instanceAlias = "";
    @property({ type: String }) welcomeMessage = "Hi! Ask me anything about this site.";
    @property({ type: String, reflect: true }) override title = "Ask the site";
    @property({ type: String }) apiBase = "/umbraco/community/chatbot/api/v1";

    @state() private open = false;
    @state() private turns: Turn[] = [];
    @state() private input = "";
    @state() private streaming = false;
    @state() private streamingTurn: Turn | null = null;
    @state() private error: string | null = null;

    /**
     * Set by the bootstrap script when the tag had `data-welcome` / `data-title`. When true we
     * keep the host page's value and ignore whatever the server returns from `/config`.
     * Avoids the brittle "compare against the literal default string" check we had before.
     */
    welcomeFromAttr = false;
    titleFromAttr = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.loadHistory();
        this.fetchConfig();
    }

    private async fetchConfig() {
        if (!this.instanceAlias) return;
        try {
            const res = await fetch(
                `${this.apiBase}/instances/${encodeURIComponent(this.instanceAlias)}/config`,
            );
            if (!res.ok) return;
            const config = (await res.json()) as {
                alias: string;
                name: string;
                welcomeMessage?: string | null;
            };
            if (!this.welcomeFromAttr && config.welcomeMessage) {
                this.welcomeMessage = config.welcomeMessage;
            }
            if (!this.titleFromAttr && config.name) {
                this.title = config.name;
            }
        } catch {
            // Network error — keep defaults; widget still works.
        }
    }

    private loadHistory() {
        if (!this.instanceAlias) return;
        try {
            const raw = localStorage.getItem(HISTORY_KEY(this.instanceAlias));
            if (raw) this.turns = JSON.parse(raw);
        } catch {
            // ignore malformed storage
        }
    }

    private saveHistory() {
        if (!this.instanceAlias) return;
        try {
            const trimmed = this.turns.slice(-MAX_TURNS);
            localStorage.setItem(HISTORY_KEY(this.instanceAlias), JSON.stringify(trimmed));
        } catch {
            // quota or disabled — non-fatal
        }
    }

    private resetHistory() {
        this.turns = [];
        this.streamingTurn = null;
        this.error = null;
        try {
            localStorage.removeItem(HISTORY_KEY(this.instanceAlias));
        } catch {
            // ignore
        }
    }

    private async send(text: string) {
        const trimmed = text.trim();
        if (!trimmed || this.streaming) return;

        const userTurn: Turn = { role: "user", content: trimmed };
        this.turns = [...this.turns, userTurn];
        this.input = "";
        this.error = null;
        this.saveHistory();

        await this.runTurn(userTurn);
    }

    /**
     * Re-tries the most recent user turn after a failure. Drops the half-streamed assistant turn
     * (if any) so the model isn't grounded in a partial answer, then re-sends the same user text.
     */
    private async retryLast() {
        if (this.streaming) return;
        const lastUser = [...this.turns].reverse().find((t) => t.role === "user");
        if (!lastUser) return;

        // Strip any assistant turn that follows the last user turn (it was an aborted response).
        const lastUserIdx = this.turns.lastIndexOf(lastUser);
        this.turns = this.turns.slice(0, lastUserIdx + 1);
        this.error = null;
        this.saveHistory();

        await this.runTurn(lastUser);
    }

    private async runTurn(userTurn: Turn) {
        const assistantTurn: Turn = { role: "assistant", content: "" };
        this.streamingTurn = assistantTurn;
        this.streaming = true;
        let failed = false;

        try {
            await this.streamReply(userTurn, assistantTurn);
        } catch (e) {
            this.error = (e as Error).message || "Something went wrong.";
            failed = true;
        } finally {
            this.streaming = false;
            // Don't commit a failed (empty/partial) turn — the user retries against a clean slate.
            if (this.streamingTurn && !failed) {
                this.turns = [...this.turns, this.streamingTurn];
                this.saveHistory();
            }
            this.streamingTurn = null;
            this.scrollToBottom();
        }
    }

    private async streamReply(_userTurn: Turn, assistantTurn: Turn) {
        const messages = this.turns
            .filter((t) => t.role === "user" || t.role === "assistant")
            .map((t) => ({ role: t.role, content: t.content }));

        const response = await fetch(`${this.apiBase}/chat`, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "text/event-stream" },
            body: JSON.stringify({ instanceAlias: this.instanceAlias, messages }),
        });

        if (!response.ok || !response.body) {
            const text = await response.text().catch(() => "");
            throw new Error(`${response.status} ${response.statusText}${text ? ": " + text : ""}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // SSE frames are separated by "\n\n". Process complete frames; keep partials in buffer.
            let sepIndex: number;
            while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
                const frame = buffer.slice(0, sepIndex);
                buffer = buffer.slice(sepIndex + 2);
                this.handleFrame(frame, assistantTurn);
            }
        }
    }

    private handleFrame(frame: string, assistantTurn: Turn) {
        let event = "message";
        let data = "";
        for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += (data ? "\n" : "") + line.slice(5).trim();
        }
        if (!data) return;

        let payload: any = null;
        try {
            payload = JSON.parse(data);
        } catch {
            return;
        }

        switch (event) {
            case "sources":
                assistantTurn.sources = payload.sources ?? [];
                this.requestUpdate();
                break;
            case "delta":
                assistantTurn.content += payload.text ?? "";
                this.requestUpdate();
                this.scrollToBottom();
                break;
            case "suggestions":
                assistantTurn.suggestions = payload.suggestions ?? [];
                this.requestUpdate();
                break;
            case "error":
                this.error = payload.message ?? "Something went wrong.";
                this.requestUpdate();
                break;
        }
    }

    private scrollToBottom() {
        requestAnimationFrame(() => {
            const log = this.renderRoot.querySelector(".log") as HTMLElement | null;
            if (log) log.scrollTop = log.scrollHeight;
        });
    }

    private toggle() {
        this.open = !this.open;
        if (this.open) this.scrollToBottom();
    }

    private renderTurn(turn: Turn, isStreaming = false) {
        // User turns stay plain text (no rendering). Assistant output is markdown — convert to HTML.
        const body =
            turn.role === "assistant"
                ? html`<div class="md">${unsafeHTML(renderMarkdown(turn.content))}</div>`
                : html`${turn.content}`;
        return html`
            <div class="turn ${turn.role}">
                <div class="bubble">${body}${isStreaming ? html`<span class="cursor">▍</span>` : nothing}</div>
                ${turn.sources && turn.sources.length > 0
                    ? html`
                          <div class="meta">
                              <div class="meta-label">Sources</div>
                              <div class="sources">
                                  ${turn.sources.map(
                                      (s) =>
                                          s.url
                                              ? html`<a class="source" href=${s.url} target="_blank" rel="noopener">📄 ${s.title}</a>`
                                              : html`<span class="source">📄 ${s.title}</span>`,
                                  )}
                              </div>
                          </div>
                      `
                    : nothing}
                ${turn.suggestions && turn.suggestions.length > 0
                    ? html`
                          <div class="meta">
                              <div class="meta-label">You might ask</div>
                              <div class="suggestions">
                                  ${turn.suggestions.map(
                                      (q) => html`
                                          <button class="suggestion" @click=${() => this.send(q)} ?disabled=${this.streaming}>
                                              ${q}
                                          </button>
                                      `,
                                  )}
                              </div>
                          </div>
                      `
                    : nothing}
            </div>
        `;
    }

    private renderPanel() {
        return html`
            <div class="panel" role="dialog" aria-label=${this.title}>
                <header class="header">
                    <strong>${this.title}</strong>
                    <button class="icon-btn" aria-label="Reset conversation" title="Reset conversation" @click=${() => this.resetHistory()}>↺</button>
                    <button class="icon-btn" aria-label="Close" @click=${() => this.toggle()}>✕</button>
                </header>
                <div class="log">
                    ${this.turns.length === 0
                        ? html`<div class="welcome">${this.welcomeMessage}</div>`
                        : this.turns.map((t) => this.renderTurn(t))}
                    ${this.streamingTurn ? this.renderTurn(this.streamingTurn, true) : nothing}
                    ${this.error
                        ? html`
                              <div class="error" role="alert">
                                  <div class="error-text">${this.error}</div>
                                  <button class="error-retry" @click=${() => this.retryLast()}>
                                      Try again
                                  </button>
                              </div>
                          `
                        : nothing}
                </div>
                <form class="composer" @submit=${(e: Event) => { e.preventDefault(); this.send(this.input); }}>
                    <input
                        type="text"
                        placeholder="Ask anything…"
                        .value=${this.input}
                        @input=${(e: any) => (this.input = e.target.value)}
                        ?disabled=${this.streaming}
                    />
                    <button type="submit" ?disabled=${this.streaming || !this.input.trim()}>Send</button>
                </form>
            </div>
        `;
    }

    render() {
        return html`
            ${this.open ? this.renderPanel() : nothing}
            <button class="fab" @click=${() => this.toggle()} aria-label=${this.open ? "Close chat" : "Open chat"}>
                ${this.open ? "✕" : "💬"}
            </button>
        `;
    }

    static styles = css`
        :host {
            position: fixed;
            right: 1.25rem;
            bottom: 1.25rem;
            z-index: 999999;
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            color: #1a1a1a;
        }
        .fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            background: #2851a3;
            color: white;
            font-size: 22px;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
            transition: transform 0.15s ease;
        }
        .fab:hover { transform: scale(1.05); }

        .panel {
            position: absolute;
            bottom: 72px;
            right: 0;
            width: 360px;
            max-width: calc(100vw - 2rem);
            height: 520px;
            max-height: calc(100vh - 6rem);
            background: white;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: #2851a3;
            color: white;
        }
        .header strong { flex: 1; }
        .icon-btn {
            background: transparent;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }
        .icon-btn:hover { background: rgba(255, 255, 255, 0.15); }

        .log {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            background: #f7f7f9;
        }
        .welcome {
            background: #ebeef5;
            color: #444;
            padding: 0.75rem;
            border-radius: 8px;
            font-style: italic;
        }
        .turn { display: flex; flex-direction: column; gap: 0.4rem; }
        .turn.user .bubble {
            align-self: flex-end;
            background: #2851a3;
            color: white;
        }
        .turn.assistant .bubble {
            align-self: flex-start;
            background: white;
            border: 1px solid #e0e0e6;
        }
        .bubble {
            max-width: 85%;
            padding: 0.6rem 0.85rem;
            border-radius: 12px;
            word-wrap: break-word;
            line-height: 1.4;
        }
        .turn.user .bubble {
            white-space: pre-wrap;
        }
        .md > :first-child { margin-top: 0; }
        .md > :last-child { margin-bottom: 0; }
        .md p { margin: 0 0 0.6em; }
        .md p:last-child { margin-bottom: 0; }
        .md ul, .md ol { margin: 0 0 0.6em; padding-left: 1.4em; }
        .md li { margin-bottom: 0.2em; }
        .md a { color: #2851a3; text-decoration: underline; word-break: break-all; }
        .md code {
            background: #ebeef5;
            padding: 0 0.25em;
            border-radius: 3px;
            font-size: 0.9em;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .md pre {
            background: #1f2330;
            color: #f5f7fb;
            padding: 0.6em 0.8em;
            border-radius: 6px;
            overflow-x: auto;
            margin: 0 0 0.6em;
            font-size: 0.85em;
        }
        .md pre code { background: transparent; padding: 0; color: inherit; }
        .md strong { font-weight: 600; }
        .cursor {
            display: inline-block;
            margin-left: 2px;
            animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
            to { visibility: hidden; }
        }

        .meta { display: flex; flex-direction: column; gap: 0.25rem; }
        .meta-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #888;
        }
        .sources, .suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
        }

        /* Sources: source-page links, neutral pill style. */
        .source {
            font-size: 12px;
            padding: 0.2rem 0.55rem;
            background: #f0f3f9;
            color: #2851a3;
            border: 1px solid #c5d0e6;
            border-radius: 4px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }
        .source:hover { background: #e3eaf5; text-decoration: underline; }

        /* Suggestions: clickable prompts to send back, accent style to invite tapping. */
        .suggestion {
            font-size: 13px;
            padding: 0.4rem 0.8rem;
            background: white;
            border: 1px dashed #2851a3;
            color: #2851a3;
            border-radius: 999px;
            cursor: pointer;
            text-align: left;
            font: inherit;
            font-size: 13px;
        }
        .suggestion:hover { background: #2851a3; color: white; border-style: solid; }
        .suggestion:disabled { opacity: 0.5; cursor: not-allowed; }

        .error {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            color: #b00020;
            background: #fde8ec;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            font-size: 13px;
        }
        .error-text { flex: 1; }
        .error-retry {
            border: 1px solid #b00020;
            background: white;
            color: #b00020;
            padding: 0.25rem 0.6rem;
            border-radius: 999px;
            font: inherit;
            font-size: 12px;
            cursor: pointer;
            white-space: nowrap;
        }
        .error-retry:hover { background: #b00020; color: white; }

        .composer {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem;
            background: white;
            border-top: 1px solid #e0e0e6;
        }
        .composer input {
            flex: 1;
            padding: 0.55rem 0.75rem;
            border: 1px solid #d6d6dc;
            border-radius: 999px;
            font: inherit;
            outline: none;
        }
        .composer input:focus { border-color: #2851a3; }
        .composer button {
            padding: 0 1.1rem;
            border: none;
            border-radius: 999px;
            background: #2851a3;
            color: white;
            cursor: pointer;
            font: inherit;
            font-weight: 500;
        }
        .composer button:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        "ucai-chatbot-widget": UcaiChatbotWidgetElement;
    }
}
