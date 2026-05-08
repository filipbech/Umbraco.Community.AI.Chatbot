import {
    UmbSubmitWorkspaceAction,
    UMB_WORKSPACE_CONDITION_ALIAS,
} from "@umbraco-cms/backoffice/workspace";
import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "../../constants.js";
import { UCAI_CHATINSTANCE_WORKSPACE_ALIAS } from "../constants.js";

export const manifests: Array<UmbExtensionManifest> = [
    {
        type: "workspace",
        kind: "routable",
        alias: UCAI_CHATINSTANCE_WORKSPACE_ALIAS,
        name: "ChatInstance Workspace",
        api: () => import("./chatinstance-workspace.context.js"),
        meta: { entityType: UCAI_CHATINSTANCE_ENTITY_TYPE },
    },
    {
        type: "workspaceView",
        alias: "Ucai.Workspace.ChatInstance.View.Details",
        name: "ChatInstance Details View",
        js: () => import("./views/chatinstance-details-workspace-view.element.js"),
        weight: 100,
        meta: { label: "Settings", pathname: "settings", icon: "icon-settings" },
        conditions: [{ alias: UMB_WORKSPACE_CONDITION_ALIAS, match: UCAI_CHATINSTANCE_WORKSPACE_ALIAS }],
    },
    {
        type: "workspaceAction",
        kind: "default",
        alias: "Ucai.WorkspaceAction.ChatInstance.Save",
        name: "Save ChatInstance",
        api: UmbSubmitWorkspaceAction,
        meta: { label: "Save", look: "primary", color: "positive" },
        conditions: [{ alias: UMB_WORKSPACE_CONDITION_ALIAS, match: UCAI_CHATINSTANCE_WORKSPACE_ALIAS }],
    },
];
