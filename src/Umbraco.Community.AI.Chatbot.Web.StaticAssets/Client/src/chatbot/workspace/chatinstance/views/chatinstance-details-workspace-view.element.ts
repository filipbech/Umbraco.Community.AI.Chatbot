import { css, html, customElement, state, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import type { UUISelectElement, UUISelectEvent } from "@umbraco-cms/backoffice/external/uui";
import type { UcaiChatInstanceDetailModel } from "../../../types.js";
import { UCAI_CHATINSTANCE_WORKSPACE_CONTEXT } from "../chatinstance-workspace.context-token.js";
import { fetchAgentOptions, type AgentOption } from "../../../agents/agent-options.repository.js";

@customElement("ucai-chatinstance-details-workspace-view")
export class UcaiChatInstanceDetailsWorkspaceViewElement extends UmbLitElement {
    #workspaceContext?: typeof UCAI_CHATINSTANCE_WORKSPACE_CONTEXT.TYPE;

    @state() private _model?: UcaiChatInstanceDetailModel;
    @state() private _agents: AgentOption[] = [];
    @state() private _agentsLoading = true;

    constructor() {
        super();
        this.consumeContext(UCAI_CHATINSTANCE_WORKSPACE_CONTEXT, (context) => {
            if (!context) return;
            this.#workspaceContext = context;
            this.observe(context.model, (m) => (this._model = m));
        });
    }

    override async connectedCallback() {
        super.connectedCallback();
        this._agentsLoading = true;
        this._agents = await fetchAgentOptions();
        this._agentsLoading = false;
    }

    #patch(patch: Partial<UcaiChatInstanceDetailModel>) {
        this.#workspaceContext?.updateModel(patch);
    }

    render() {
        if (!this._model) return html`<uui-loader></uui-loader>`;
        const m = this._model;

        return html`
            <uui-box headline="Settings">
                <umb-property-layout
                    label="Agent"
                    description="Pick a configured Umbraco.AI Agent (under AI → Add-ons → Agents)."
                    mandatory
                >
                    <div slot="editor">${this.#renderAgentSelect(m)}</div>
                </umb-property-layout>

                <umb-property-layout
                    label="Welcome message"
                    description="Shown by the widget when a visitor opens the chat."
                >
                    <uui-textarea
                        slot="editor"
                        rows="2"
                        .value=${m.welcomeMessage ?? ""}
                        @input=${(e: InputEvent) =>
                            this.#patch({ welcomeMessage: (e.target as HTMLTextAreaElement).value })}
                    ></uui-textarea>
                </umb-property-layout>

                <umb-property-layout
                    label="Fallback message"
                    description="Shown when the answer can't be grounded in your content."
                    mandatory
                >
                    <uui-textarea
                        slot="editor"
                        rows="2"
                        .value=${m.fallbackMessage}
                        @input=${(e: InputEvent) =>
                            this.#patch({ fallbackMessage: (e.target as HTMLTextAreaElement).value })}
                    ></uui-textarea>
                </umb-property-layout>

                <umb-property-layout
                    label="Sources per answer"
                    description="How many of the most relevant pages from your site the assistant gets to read for each answer. Higher = more context, but slower and more expensive."
                >
                    <uui-input
                        slot="editor"
                        type="number"
                        min="1"
                        max="50"
                        .value=${String(m.topK)}
                        @input=${(e: InputEvent) =>
                            this.#patch({
                                topK: Number((e.target as HTMLInputElement).value) || 5,
                            })}
                    ></uui-input>
                </umb-property-layout>

                <umb-property-layout
                    label="Follow-up suggestions"
                    description="How many follow-up questions to suggest after each answer (0 disables them)."
                >
                    <uui-input
                        slot="editor"
                        type="number"
                        min="0"
                        max="5"
                        .value=${String(m.suggestionCount)}
                        @input=${(e: InputEvent) => {
                            const raw = Number((e.target as HTMLInputElement).value);
                            const clamped = Math.max(0, Math.min(5, isNaN(raw) ? 3 : raw));
                            this.#patch({ suggestionCount: clamped });
                        }}
                    ></uui-input>
                </umb-property-layout>

            </uui-box>

            ${m.dateCreated || m.dateModified
                ? html`
                      <uui-box headline="Info">
                          ${m.dateCreated
                              ? html`<umb-property-layout label="Created" orientation="vertical">
                                    <div slot="editor">${formatDate(m.dateCreated)}</div>
                                </umb-property-layout>`
                              : nothing}
                          ${m.dateModified
                              ? html`<umb-property-layout label="Modified" orientation="vertical">
                                    <div slot="editor">${formatDate(m.dateModified)}</div>
                                </umb-property-layout>`
                              : nothing}
                      </uui-box>
                  `
                : nothing}
        `;
    }

    #renderAgentSelect(m: UcaiChatInstanceDetailModel) {
        if (this._agentsLoading) {
            return html`<uui-loader-bar></uui-loader-bar>`;
        }

        if (this._agents.length === 0) {
            return html`<em
                >No agents found. Configure one under <strong>AI → Add-ons → Agents</strong> first.</em
            >`;
        }

        // If the current value isn't in the list (legacy / deleted agent) keep it visible
        // so saves don't accidentally lose it.
        const current = m.agentAlias;
        const includesCurrent = !!current && this._agents.some((a) => a.alias === current);
        const options = [
            { name: current ? "" : "Select agent…", value: "", selected: !current },
            ...this._agents.map((a) => ({
                name: `${a.name} (${a.alias})`,
                value: a.alias,
                selected: a.alias === current,
            })),
            ...(!includesCurrent && current
                ? [{ name: `${current} (missing)`, value: current, selected: true }]
                : []),
        ];

        return html`
            <uui-select
                .options=${options}
                @change=${(e: UUISelectEvent) =>
                    this.#patch({ agentAlias: String((e.target as UUISelectElement).value ?? "") })}
            ></uui-select>
        `;
    }

    static styles = [
        UmbTextStyles,
        css`
            :host {
                display: block;
                padding: var(--uui-size-layout-1);
            }
            uui-box {
                --uui-box-default-padding: 0 var(--uui-size-space-5);
            }
            uui-box:not(:first-child) {
                margin-top: var(--uui-size-layout-1);
            }
            uui-select {
                width: 100%;
            }
        `,
    ];
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default UcaiChatInstanceDetailsWorkspaceViewElement;

declare global {
    interface HTMLElementTagNameMap {
        "ucai-chatinstance-details-workspace-view": UcaiChatInstanceDetailsWorkspaceViewElement;
    }
}
