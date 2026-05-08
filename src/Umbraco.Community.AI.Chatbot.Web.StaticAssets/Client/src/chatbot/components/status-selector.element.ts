import { css, html, customElement, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

/**
 * Two-state segmented control: Active / Inactive. Mirrors the Umbraco.AI Connections
 * status selector — kept private here to avoid a hard cross-package dependency.
 */
@customElement("ucai-status-selector")
export class UcaiStatusSelectorElement extends UmbLitElement {
    @property({ type: Boolean })
    value = true;

    #onSelect(active: boolean) {
        if (this.value === active) return;
        this.value = active;
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: active },
                bubbles: true,
                composed: true,
            }),
        );
    }

    override render() {
        return html`
            <div id="container">
                <button
                    class=${this.value ? "selected" : ""}
                    @click=${() => this.#onSelect(true)}
                    aria-pressed=${this.value}
                >
                    <uui-icon name="icon-check"></uui-icon>
                    Active
                </button>
                <button
                    class=${!this.value ? "selected" : ""}
                    @click=${() => this.#onSelect(false)}
                    aria-pressed=${!this.value}
                >
                    <uui-icon name="icon-block"></uui-icon>
                    Inactive
                </button>
            </div>
        `;
    }

    static override styles = [
        css`
            :host {
                display: inline-block;
            }
            #container {
                height: 100%;
                box-sizing: border-box;
                display: flex;
                border-radius: var(--uui-border-radius);
                border: 1px solid var(--uui-color-border);
                background: var(--uui-color-surface-alt);
                padding: 2px;
                gap: 2px;
            }
            button {
                display: flex;
                align-items: center;
                gap: var(--uui-size-space-2);
                padding: var(--uui-size-space-2) var(--uui-size-space-4);
                border: none;
                border-radius: calc(var(--uui-border-radius) - 2px);
                background: transparent;
                color: #aaa;
                font-family: inherit;
                font-size: var(--uui-type-small-size);
                font-weight: 500;
                cursor: pointer;
                transition: all 120ms ease;
                white-space: nowrap;
            }
            button:hover:not(.selected) {
                color: var(--uui-color-text);
                background: var(--uui-color-surface);
            }
            button.selected {
                background: var(--uui-color-surface);
                color: var(--uui-color-text);
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
            }
            button uui-icon {
                font-size: 12px;
            }
            button.selected:first-child uui-icon {
                color: var(--uui-color-positive);
            }
            button.selected:last-child uui-icon {
                color: var(--uui-color-danger);
            }
        `,
    ];
}

declare global {
    interface HTMLElementTagNameMap {
        "ucai-status-selector": UcaiStatusSelectorElement;
    }
}
