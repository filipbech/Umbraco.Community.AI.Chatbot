import { UMB_WORKSPACE_PATH_PATTERN } from "@umbraco-cms/backoffice/workspace";
import { UmbPathPattern } from "@umbraco-cms/backoffice/router";
import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "../../constants.js";

const UAI_AI_SECTION_PATHNAME = "ai";

export const UCAI_CHATINSTANCE_WORKSPACE_PATH = UMB_WORKSPACE_PATH_PATTERN.generateAbsolute({
    sectionName: UAI_AI_SECTION_PATHNAME,
    entityType: UCAI_CHATINSTANCE_ENTITY_TYPE,
});

export const UCAI_CREATE_CHATINSTANCE_WORKSPACE_PATH = `${UCAI_CHATINSTANCE_WORKSPACE_PATH}/create`;

export const UCAI_EDIT_CHATINSTANCE_WORKSPACE_PATH_PATTERN = new UmbPathPattern<{ unique: string }>(
    "edit/:unique",
    UCAI_CHATINSTANCE_WORKSPACE_PATH,
);
