import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbRoutableWorkspaceContext } from "@umbraco-cms/backoffice/workspace";
import {
    UmbSubmittableWorkspaceContextBase,
    UmbWorkspaceIsNewRedirectController,
    UmbWorkspaceIsNewRedirectControllerAlias,
    UmbWorkspaceRouteManager,
} from "@umbraco-cms/backoffice/workspace";
import { UmbBasicState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { UmbEntityContext } from "@umbraco-cms/backoffice/entity";
import { UcaiChatInstanceDetailRepository } from "../../repository/detail/chatinstance-detail.repository.js";
import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "../../constants.js";
import type { UcaiChatInstanceDetailModel } from "../../types.js";
import { UCAI_CHATINSTANCE_WORKSPACE_ALIAS } from "../constants.js";
import { UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH } from "../chatinstance-root/paths.js";
import { UCAI_EDIT_CHATINSTANCE_WORKSPACE_PATH_PATTERN } from "./paths.js";
import { UcaiChatInstanceWorkspaceEditorElement } from "./chatinstance-workspace-editor.element.js";

export class UcaiChatInstanceWorkspaceContext
    extends UmbSubmittableWorkspaceContextBase<UcaiChatInstanceDetailModel>
    implements UmbRoutableWorkspaceContext
{
    readonly routes = new UmbWorkspaceRouteManager(this);

    #unique = new UmbBasicState<string | undefined>(undefined);
    readonly unique = this.#unique.asObservable();

    #model = new UmbObjectState<UcaiChatInstanceDetailModel | undefined>(undefined);
    readonly model = this.#model.asObservable();

    #repository: UcaiChatInstanceDetailRepository;
    #entityContext = new UmbEntityContext(this);

    constructor(host: UmbControllerHost) {
        super(host, UCAI_CHATINSTANCE_WORKSPACE_ALIAS);
        this.#repository = new UcaiChatInstanceDetailRepository(this);

        this.#entityContext.setEntityType(UCAI_CHATINSTANCE_ENTITY_TYPE);
        this.observe(this.unique, (unique) => this.#entityContext.setUnique(unique ?? null));

        this.routes.setRoutes([
            {
                path: "create",
                component: UcaiChatInstanceWorkspaceEditorElement,
                setup: async (_component, _info) => {
                    await this.scaffold();
                    new UmbWorkspaceIsNewRedirectController(
                        this,
                        this,
                        this.getHostElement().shadowRoot!.querySelector("umb-router-slot")!,
                    );
                },
            },
            {
                path: "edit/:unique",
                component: UcaiChatInstanceWorkspaceEditorElement,
                setup: (_component, info) => {
                    this.removeUmbControllerByAlias(UmbWorkspaceIsNewRedirectControllerAlias);
                    this.load(info.match.params.unique);
                },
            },
        ]);
    }

    protected override resetState(): void {
        super.resetState();
        this.#unique.setValue(undefined);
        this.#model.setValue(undefined);
    }

    async scaffold() {
        this.resetState();
        const { data } = await this.#repository.createScaffold();
        if (data) {
            this.#unique.setValue("");
            this.#model.setValue(data);
            this.setIsNew(true);
        }
    }

    async load(unique: string) {
        this.resetState();
        const { data, asObservable } = await this.#repository.requestByUnique(unique);

        if (asObservable) {
            this.observe(
                asObservable(),
                (model) => {
                    if (model) {
                        this.#unique.setValue(model.unique);
                        this.#model.setValue(structuredClone(model));
                        this.setIsNew(false);
                    }
                },
                "_observeModel",
            );
        }
        return data;
    }

    updateModel(patch: Partial<UcaiChatInstanceDetailModel>) {
        const current = this.#model.getValue();
        if (!current) return;
        this.#model.setValue({ ...current, ...patch });
    }

    getData(): UcaiChatInstanceDetailModel | undefined {
        return this.#model.getValue();
    }

    getUnique(): string | undefined {
        return this.#unique.getValue();
    }

    getEntityType(): string {
        return UCAI_CHATINSTANCE_ENTITY_TYPE;
    }

    /**
     * Save / create. Triggered by the workspace `Save` action which calls `requestSubmit()`
     * on the workspace context, which in turn calls `submit()`.
     */
    async submit() {
        const model = this.#model.getValue();
        if (!model) return;

        if (this.getIsNew()) {
            const { data, error } = await this.#repository.create(model, null);
            if (error || !data) {
                throw error ?? new Error("Failed to create chat instance.");
            }
            this.#unique.setValue(data.unique);
            this.#model.setValue(data);
            this.setIsNew(false);
            // Navigate to the persisted item's edit URL so subsequent saves are PUT.
            // The path pattern includes the section + entityType so we don't have to
            // hand-build the URL (and get the entity-type segment wrong).
            const editPath = UCAI_EDIT_CHATINSTANCE_WORKSPACE_PATH_PATTERN.generateAbsolute({
                unique: data.unique,
            });
            window.history.replaceState(null, "", editPath);
        } else {
            const { data, error } = await this.#repository.save(model);
            if (error) {
                throw error;
            }
            if (data) {
                this.#model.setValue(data);
            }
        }
    }
}

export { UcaiChatInstanceWorkspaceContext as api };
