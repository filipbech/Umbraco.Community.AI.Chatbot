import { UmbDetailRepositoryBase } from "@umbraco-cms/backoffice/repository";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbRequestReloadChildrenOfEntityEvent } from "@umbraco-cms/backoffice/entity-action";
import { UmbActionEventContext, UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";
import { UcaiChatInstanceDetailServerDataSource } from "./chatinstance-detail.server.data-source.js";
import { UCAI_CHATINSTANCE_DETAIL_STORE_CONTEXT } from "./chatinstance-detail.store.js";
import { UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE } from "../../constants.js";
import type { UcaiChatInstanceDetailModel } from "../../types.js";

export class UcaiChatInstanceDetailRepository extends UmbDetailRepositoryBase<UcaiChatInstanceDetailModel> {
    constructor(host: UmbControllerHost) {
        super(host, UcaiChatInstanceDetailServerDataSource, UCAI_CHATINSTANCE_DETAIL_STORE_CONTEXT);
    }

    override async create(model: UcaiChatInstanceDetailModel, parentUnique: string | null = null) {
        const result = await super.create(model, parentUnique);
        if (!result.error) {
            await this.#requestReload();
        }
        return result;
    }

    override async delete(unique: string) {
        const result = await super.delete(unique);
        if (!result.error) {
            await this.#requestReload();
        }
        return result;
    }

    async #requestReload() {
        // Tell anyone watching the Chatbot root (collection workspace) that the
        // children list is stale. The collection re-requests its data in response.
        const ctx = (await this.getContext(UMB_ACTION_EVENT_CONTEXT)) as
            | UmbActionEventContext
            | undefined;
        ctx?.dispatchEvent(
            new UmbRequestReloadChildrenOfEntityEvent({
                entityType: UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE,
                unique: null,
            }),
        );
    }
}

export { UcaiChatInstanceDetailRepository as api };
