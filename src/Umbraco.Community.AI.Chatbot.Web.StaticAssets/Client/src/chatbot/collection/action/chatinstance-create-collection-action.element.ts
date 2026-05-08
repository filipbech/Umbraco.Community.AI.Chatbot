import { html, customElement } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UCAI_CREATE_CHATINSTANCE_WORKSPACE_PATH } from "../../workspace/chatinstance/paths.js";

@customElement("ucai-chatinstance-create-collection-action")
export class UcaiChatInstanceCreateCollectionActionElement extends UmbLitElement {
    override render() {
        return html`
            <uui-button
                look="outline"
                label="Create"
                href=${UCAI_CREATE_CHATINSTANCE_WORKSPACE_PATH}
            >
                Create
            </uui-button>
        `;
    }
}

export default UcaiChatInstanceCreateCollectionActionElement;

declare global {
    interface HTMLElementTagNameMap {
        "ucai-chatinstance-create-collection-action": UcaiChatInstanceCreateCollectionActionElement;
    }
}
