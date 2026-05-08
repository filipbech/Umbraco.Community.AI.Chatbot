import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbDetailDataSource } from "@umbraco-cms/backoffice/repository";
import { umbHttpClient } from "@umbraco-cms/backoffice/http-client";
import {
    UCAI_CHATBOT_API_BASE,
    UCAI_CHATINSTANCE_ENTITY_TYPE,
} from "../../constants.js";
import { UcaiChatInstanceTypeMapper } from "../../type-mapper.js";
import type {
    ChatInstanceResponseModel,
    UcaiChatInstanceDetailModel,
} from "../../types.js";

// `umbHttpClient` already returns { data, error, request, response }, so we just
// await it and forward the shape that UmbDetailRepositoryBase expects.
const security = [{ type: "http" as const, scheme: "bearer" as const }];

export class UcaiChatInstanceDetailServerDataSource implements UmbDetailDataSource<UcaiChatInstanceDetailModel> {
    #host: UmbControllerHost;

    constructor(host: UmbControllerHost) {
        this.#host = host;
    }

    async createScaffold(preset?: Partial<UcaiChatInstanceDetailModel>) {
        const scaffold: UcaiChatInstanceDetailModel = {
            unique: "",
            entityType: UCAI_CHATINSTANCE_ENTITY_TYPE,
            id: "",
            name: "",
            alias: "",
            agentAlias: "",
            welcomeMessage: "",
            fallbackMessage:
                "I can only answer based on this site's content. I couldn't find anything about that here.",
            topK: 5,
            suggestionCount: 3,
            enabled: true,
            dateCreated: null,
            dateModified: null,
            ...preset,
        };
        return { data: scaffold };
    }

    async read(unique: string) {
        const { data, error } = (await umbHttpClient.get({
            url: `${UCAI_CHATBOT_API_BASE}/${encodeURIComponent(unique)}`,
            security,
        })) as { data?: ChatInstanceResponseModel; error?: Error };
        if (error || !data) return { error };
        return { data: UcaiChatInstanceTypeMapper.toDetailModel(data) };
    }

    async create(model: UcaiChatInstanceDetailModel, _parentUnique: string | null) {
        const { data, error } = (await umbHttpClient.post({
            url: UCAI_CHATBOT_API_BASE,
            body: UcaiChatInstanceTypeMapper.toRequest(model),
            security,
        })) as { data?: ChatInstanceResponseModel; error?: Error };
        if (error || !data) return { error };
        return { data: UcaiChatInstanceTypeMapper.toDetailModel(data) };
    }

    async update(model: UcaiChatInstanceDetailModel) {
        const { data, error } = (await umbHttpClient.put({
            url: `${UCAI_CHATBOT_API_BASE}/${encodeURIComponent(model.unique)}`,
            body: UcaiChatInstanceTypeMapper.toRequest(model),
            security,
        })) as { data?: ChatInstanceResponseModel; error?: Error };
        if (error || !data) return { error };
        return { data: UcaiChatInstanceTypeMapper.toDetailModel(data) };
    }

    async delete(unique: string) {
        const { error } = (await umbHttpClient.delete({
            url: `${UCAI_CHATBOT_API_BASE}/${encodeURIComponent(unique)}`,
            security,
        })) as { error?: Error };
        if (error) return { error };
        return {};
    }
}
