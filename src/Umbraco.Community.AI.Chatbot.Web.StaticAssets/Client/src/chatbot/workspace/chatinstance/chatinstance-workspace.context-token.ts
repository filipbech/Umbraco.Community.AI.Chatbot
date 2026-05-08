import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import type { UmbSubmittableWorkspaceContext } from "@umbraco-cms/backoffice/workspace";
import type { UcaiChatInstanceWorkspaceContext } from "./chatinstance-workspace.context.js";
import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "../../constants.js";

export const UCAI_CHATINSTANCE_WORKSPACE_CONTEXT = new UmbContextToken<
    UmbSubmittableWorkspaceContext,
    UcaiChatInstanceWorkspaceContext
>(
    "UmbWorkspaceContext",
    undefined,
    (context): context is UcaiChatInstanceWorkspaceContext =>
        context.getEntityType?.() === UCAI_CHATINSTANCE_ENTITY_TYPE,
);
