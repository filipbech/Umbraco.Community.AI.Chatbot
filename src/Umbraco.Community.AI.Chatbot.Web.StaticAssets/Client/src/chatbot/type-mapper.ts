import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "./constants.js";
import type {
    ChatInstanceResponseModel,
    CreateOrUpdateChatInstanceRequestModel,
    UcaiChatInstanceDetailModel,
    UcaiChatInstanceItemModel,
} from "./types.js";

// Backend uses `alias` as the URL key for read/update/delete, so we use it as
// `unique` in the UI as well — keeps the workspace edit URLs natural.
export const UcaiChatInstanceTypeMapper = {
    toDetailModel(response: ChatInstanceResponseModel): UcaiChatInstanceDetailModel {
        return {
            unique: response.alias,
            entityType: UCAI_CHATINSTANCE_ENTITY_TYPE,
            id: response.id,
            name: response.name || response.alias,
            alias: response.alias,
            agentAlias: response.agentAlias,
            welcomeMessage: response.welcomeMessage ?? "",
            fallbackMessage: response.fallbackMessage,
            topK: response.topK,
            suggestionCount: response.suggestionCount,
            enabled: response.enabled,
            dateCreated: response.dateCreated,
            dateModified: response.dateModified,
        };
    },

    toItemModel(response: ChatInstanceResponseModel): UcaiChatInstanceItemModel {
        return {
            unique: response.alias,
            entityType: UCAI_CHATINSTANCE_ENTITY_TYPE,
            id: response.id,
            name: response.name || response.alias,
            alias: response.alias,
            agentAlias: response.agentAlias,
            enabled: response.enabled,
            topK: response.topK,
            dateModified: response.dateModified,
        };
    },

    toRequest(model: UcaiChatInstanceDetailModel): CreateOrUpdateChatInstanceRequestModel {
        return {
            name: model.name,
            alias: model.alias,
            agentAlias: model.agentAlias,
            welcomeMessage: model.welcomeMessage,
            fallbackMessage: model.fallbackMessage,
            topK: model.topK,
            suggestionCount: model.suggestionCount,
            enabled: model.enabled,
        };
    },
};
