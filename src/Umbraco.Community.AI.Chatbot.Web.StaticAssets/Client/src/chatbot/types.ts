import type { UmbEntityModel } from "@umbraco-cms/backoffice/entity";

export interface UcaiChatInstanceDetailModel extends UmbEntityModel {
    unique: string;
    entityType: string;
    id: string;
    name: string;
    alias: string;
    agentAlias: string;
    welcomeMessage: string;
    fallbackMessage: string;
    topK: number;
    suggestionCount: number;
    enabled: boolean;
    dateCreated: string | null;
    dateModified: string | null;
}

export interface UcaiChatInstanceItemModel extends UmbEntityModel {
    unique: string;
    entityType: string;
    id: string;
    name: string;
    alias: string;
    agentAlias: string;
    enabled: boolean;
    topK: number;
    dateModified: string | null;
}

export interface ChatInstanceResponseModel {
    id: string;
    name: string;
    alias: string;
    agentAlias: string;
    welcomeMessage?: string | null;
    fallbackMessage: string;
    topK: number;
    suggestionCount: number;
    enabled: boolean;
    dateCreated: string;
    dateModified: string;
}

export interface CreateOrUpdateChatInstanceRequestModel {
    name: string;
    alias: string;
    agentAlias: string;
    welcomeMessage?: string | null;
    fallbackMessage: string;
    topK: number;
    suggestionCount: number;
    enabled: boolean;
}
