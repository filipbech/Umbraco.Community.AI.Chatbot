import { UMB_WORKSPACE_CONDITION_ALIAS } from "@umbraco-cms/backoffice/workspace";
import { UCAI_CHATBOT_ICON, UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE } from "../../constants.js";
import { UCAI_CHATINSTANCE_COLLECTION_ALIAS } from "../../collection/constants.js";
import { UCAI_CHATINSTANCE_ROOT_WORKSPACE_ALIAS } from "../constants.js";

export const manifests: Array<UmbExtensionManifest> = [
    {
        type: "workspace",
        kind: "default",
        alias: UCAI_CHATINSTANCE_ROOT_WORKSPACE_ALIAS,
        name: "ChatInstance Root Workspace",
        meta: {
            entityType: UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE,
            headline: "Chatbot",
        },
    },
    {
        type: "workspaceView",
        kind: "collection",
        alias: "Ucai.WorkspaceView.ChatInstanceRoot.Collection",
        name: "ChatInstance Root Collection View",
        meta: {
            label: "Collection",
            pathname: "collection",
            icon: UCAI_CHATBOT_ICON,
            collectionAlias: UCAI_CHATINSTANCE_COLLECTION_ALIAS,
        },
        conditions: [
            { alias: UMB_WORKSPACE_CONDITION_ALIAS, match: UCAI_CHATINSTANCE_ROOT_WORKSPACE_ALIAS },
        ],
    },
];
