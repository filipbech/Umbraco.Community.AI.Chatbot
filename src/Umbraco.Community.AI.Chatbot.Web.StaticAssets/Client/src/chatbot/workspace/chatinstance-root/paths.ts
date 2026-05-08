import { UMB_WORKSPACE_PATH_PATTERN } from "@umbraco-cms/backoffice/workspace";
import { UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE } from "../../constants.js";

// The Umbraco AI section's pathname (matches `Umbraco.AI/.../constants.ts`).
const UAI_AI_SECTION_PATHNAME = "ai";

export const UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH = UMB_WORKSPACE_PATH_PATTERN.generateAbsolute({
    sectionName: UAI_AI_SECTION_PATHNAME,
    entityType: UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE,
});
