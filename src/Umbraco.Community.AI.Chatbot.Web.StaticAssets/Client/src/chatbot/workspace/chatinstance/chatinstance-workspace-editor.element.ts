import { css, html, customElement, state, when } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import type { UUIInputElement, UUIInputEvent } from "@umbraco-cms/backoffice/external/uui";
import { UCAI_CHATINSTANCE_WORKSPACE_ALIAS } from "../constants.js";
import { UCAI_CHATINSTANCE_WORKSPACE_CONTEXT } from "./chatinstance-workspace.context-token.js";
import { UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH } from "../chatinstance-root/paths.js";
import type { UcaiChatInstanceDetailModel } from "../../types.js";
import "../../components/status-selector.element.js";

@customElement("ucai-chatinstance-workspace-editor")
export class UcaiChatInstanceWorkspaceEditorElement extends UmbLitElement {
    #workspaceContext?: typeof UCAI_CHATINSTANCE_WORKSPACE_CONTEXT.TYPE;

    @state() private _model?: UcaiChatInstanceDetailModel;
    @state() private _isNew?: boolean;
    @state() private _aliasLocked = true;

    constructor() {
        super();
        this.consumeContext(UCAI_CHATINSTANCE_WORKSPACE_CONTEXT, (context) => {
            if (!context) return;
            this.#workspaceContext = context;
            this.observe(context.model, (m) => (this._model = m));
            this.observe(context.isNew, (n) => {
                this._isNew = n;
                if (n) {
                    requestAnimationFrame(() => {
                        (this.shadowRoot?.querySelector("#name") as HTMLElement | null)?.focus();
                    });
                }
            });
        });
    }

    #onNameChange(e: UUIInputEvent) {
        e.stopPropagation();
        const target = e.composedPath()[0] as UUIInputElement;
        const name = String(target.value ?? "");

        if (this._aliasLocked && this._isNew) {
            // While the alias is locked on a new entity we follow the name.
            this.#workspaceContext?.updateModel({ name, alias: slugify(name) });
        } else {
            this.#workspaceContext?.updateModel({ name });
        }
    }

    #onAliasChange(e: UUIInputEvent) {
        e.stopPropagation();
        const target = e.composedPath()[0] as UUIInputElement;
        const slug = slugify(String(target.value ?? ""));
        // Reflect the sanitised value back so what they see is what they save.
        if (target.value !== slug) {
            target.value = slug;
        }
        this.#workspaceContext?.updateModel({ alias: slug });
    }

    #onToggleAliasLock() {
        this._aliasLocked = !this._aliasLocked;
    }

    #onEnabledChange(e: CustomEvent<{ value: boolean }>) {
        this.#workspaceContext?.updateModel({ enabled: e.detail.value });
    }

    render() {
        if (!this._model) return html`<uui-loader></uui-loader>`;

        const headlineLabel = this._isNew
            ? "New chat instance"
            : (this._model.name || this._model.alias || "Chat instance");

        return html`
            <umb-workspace-editor alias=${UCAI_CHATINSTANCE_WORKSPACE_ALIAS}>
                <div id="header" slot="header">
                    <uui-button
                        href=${UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH}
                        label="Back to chat instances"
                        compact
                    >
                        <uui-icon name="icon-arrow-left"></uui-icon>
                    </uui-button>
                    <uui-input
                        id="name"
                        .value=${this._model.name}
                        @input=${this.#onNameChange}
                        label="Name"
                        placeholder="Enter chat instance name"
                        required
                        maxlength="255"
                    >
                        <uui-input-lock
                            slot="append"
                            id="alias"
                            name="alias"
                            label="Alias"
                            placeholder="Enter alias"
                            .value=${this._model.alias}
                            ?auto-width=${!!this._model.name}
                            ?locked=${this._aliasLocked}
                            ?readonly=${this._aliasLocked || !this._isNew}
                            @input=${this.#onAliasChange}
                            @lock-change=${this.#onToggleAliasLock}
                            required
                            maxlength="100"
                            pattern="^[a-z0-9\\-]+$"
                        ></uui-input-lock>
                    </uui-input>

                    <ucai-status-selector
                        .value=${this._model.enabled}
                        @change=${this.#onEnabledChange}
                    ></ucai-status-selector>
                </div>

                ${when(
                    !this._isNew && this._model,
                    () =>
                        html`<umb-workspace-entity-action-menu slot="action-menu"></umb-workspace-entity-action-menu>`,
                )}

                <div slot="footer-info" id="footer">
                    <a href=${UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH}>Chatbot</a>
                    / ${headlineLabel}
                </div>
            </umb-workspace-editor>
        `;
    }

    static styles = [
        UmbTextStyles,
        css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
            #header {
                display: flex;
                flex: 1 1 auto;
                gap: var(--uui-size-space-3);
                align-items: center;
            }
            #name {
                width: 100%;
                flex: 1 1 auto;
                align-items: center;
            }
            #footer {
                padding: 0 var(--uui-size-layout-1);
            }
        `,
    ];
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default UcaiChatInstanceWorkspaceEditorElement;

declare global {
    interface HTMLElementTagNameMap {
        "ucai-chatinstance-workspace-editor": UcaiChatInstanceWorkspaceEditorElement;
    }
}
