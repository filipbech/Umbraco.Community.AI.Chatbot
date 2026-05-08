import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbCollectionDataSource, UmbCollectionFilterModel } from "@umbraco-cms/backoffice/collection";
import { umbHttpClient } from "@umbraco-cms/backoffice/http-client";
import { UCAI_CHATBOT_API_BASE } from "../../constants.js";
import { UcaiChatInstanceTypeMapper } from "../../type-mapper.js";
import type { ChatInstanceResponseModel, UcaiChatInstanceItemModel } from "../../types.js";

const security = [{ type: "http" as const, scheme: "bearer" as const }];

export class UcaiChatInstanceCollectionServerDataSource
    implements UmbCollectionDataSource<UcaiChatInstanceItemModel>
{
    #host: UmbControllerHost;

    constructor(host: UmbControllerHost) {
        this.#host = host;
    }

    async getCollection(filter: UmbCollectionFilterModel) {
        const { data, error } = (await umbHttpClient.get({
            url: UCAI_CHATBOT_API_BASE,
            security,
        })) as { data?: ChatInstanceResponseModel[]; error?: Error };

        if (error || !data) {
            return { error };
        }

        let items = data.map((row: ChatInstanceResponseModel) => UcaiChatInstanceTypeMapper.toItemModel(row));

        // The list endpoint doesn't take a filter param, so apply it client-side.
        const q = (filter as { filter?: string }).filter?.trim().toLowerCase();
        if (q) {
            items = items.filter(
                (i: UcaiChatInstanceItemModel) =>
                    i.name.toLowerCase().includes(q) ||
                    i.alias.toLowerCase().includes(q) ||
                    i.agentAlias.toLowerCase().includes(q),
            );
        }

        return {
            data: {
                items,
                total: items.length,
            },
        };
    }
}
