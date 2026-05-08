import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type {
    UmbTableColumn,
    UmbTableItem,
    UmbTableConfig,
    UmbTableSelectedEvent,
    UmbTableDeselectedEvent,
    UmbTableElement,
} from "@umbraco-cms/backoffice/components";
import type { UmbDefaultCollectionContext } from "@umbraco-cms/backoffice/collection";
import { UMB_COLLECTION_CONTEXT } from "@umbraco-cms/backoffice/collection";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import type { UcaiChatInstanceItemModel } from "../../../types.js";
import { UCAI_CHATBOT_ICON } from "../../../constants.js";
import { UCAI_EDIT_CHATINSTANCE_WORKSPACE_PATH_PATTERN } from "../../../workspace/chatinstance/paths.js";

@customElement("ucai-chatinstance-table-collection-view")
export class UcaiChatInstanceTableCollectionViewElement extends UmbLitElement {
    @state() private _tableConfig: UmbTableConfig = { allowSelection: true };
    @state() private _items: UmbTableItem[] = [];
    @state() private _selection: string[] = [];

    #context?: UmbDefaultCollectionContext<UcaiChatInstanceItemModel>;

    private _columns: UmbTableColumn[] = [
        { name: "Name", alias: "name" },
        { name: "Alias", alias: "alias" },
        { name: "Agent alias", alias: "agentAlias" },
        { name: "Sources", alias: "topK" },
        { name: "Status", alias: "status" },
        { name: "Modified", alias: "dateModified" },
    ];

    constructor() {
        super();
        this.consumeContext(UMB_COLLECTION_CONTEXT, (instance) => {
            this.#context = instance;
            if (!this.#context) return;
            // Mirror Connections: enabling selectable on the collection context is what
            // surfaces the bulk-action toolbar in the workspace shell when items are picked.
            this.#context.selection.setSelectable(true);
            this.observe(
                this.#context.items,
                (items) => this.#createItems(items as UcaiChatInstanceItemModel[]),
                "_items",
            );
            this.observe(
                this.#context.selection.selection,
                (sel) => (this._selection = sel as string[]),
                "_selection",
            );
        });
    }

    #createItems(items: UcaiChatInstanceItemModel[]) {
        this._items = items.map((item) => ({
            id: item.unique,
            icon: UCAI_CHATBOT_ICON,
            data: [
                {
                    columnAlias: "name",
                    value: html`<a
                        href=${UCAI_EDIT_CHATINSTANCE_WORKSPACE_PATH_PATTERN.generateAbsolute({
                            unique: item.unique,
                        })}
                        >${item.name}</a
                    >`,
                },
                { columnAlias: "alias", value: item.alias },
                { columnAlias: "agentAlias", value: item.agentAlias },
                { columnAlias: "topK", value: item.topK },
                {
                    columnAlias: "status",
                    value: item.enabled
                        ? html`<uui-tag color="positive" look="primary">Active</uui-tag>`
                        : html`<uui-tag color="default" look="secondary">Disabled</uui-tag>`,
                },
                {
                    columnAlias: "dateModified",
                    value: item.dateModified ? formatDate(item.dateModified) : "-",
                },
            ],
        }));
    }

    #onSelected(e: UmbTableSelectedEvent) {
        e.stopPropagation();
        const table = e.target as UmbTableElement;
        this.#context?.selection.setSelection(table.selection);
    }

    #onDeselected(e: UmbTableDeselectedEvent) {
        e.stopPropagation();
        const table = e.target as UmbTableElement;
        this.#context?.selection.setSelection(table.selection);
    }

    render() {
        return html`<umb-table
            .config=${this._tableConfig}
            .columns=${this._columns}
            .items=${this._items}
            .selection=${this._selection}
            @selected=${this.#onSelected}
            @deselected=${this.#onDeselected}
        ></umb-table>`;
    }

    static styles = [
        UmbTextStyles,
        css`
            uui-tag {
                white-space: nowrap;
            }
        `,
    ];
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default UcaiChatInstanceTableCollectionViewElement;

declare global {
    interface HTMLElementTagNameMap {
        "ucai-chatinstance-table-collection-view": UcaiChatInstanceTableCollectionViewElement;
    }
}
