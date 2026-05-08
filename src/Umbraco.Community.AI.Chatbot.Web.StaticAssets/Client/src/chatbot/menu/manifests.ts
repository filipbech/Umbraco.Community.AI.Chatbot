import type { UaiEntityContainerMenuItemManifest } from "@umbraco-ai/core";
import { UAI_ADDONS_MENU_ALIAS } from "@umbraco-ai/core";
import {
    UCAI_CHATBOT_ICON,
    UCAI_CHATINSTANCE_ENTITY_TYPE,
    UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE,
} from "../constants.js";

export const menuManifests: Array<UaiEntityContainerMenuItemManifest> = [
    {
        type: "menuItem",
        kind: "entityContainer",
        alias: "Ucai.MenuItem.Chatbot",
        name: "Chatbot Menu Item",
        weight: 80,
        meta: {
            label: "Chatbot",
            icon: UCAI_CHATBOT_ICON,
            entityType: UCAI_CHATINSTANCE_ROOT_ENTITY_TYPE,
            childEntityTypes: [UCAI_CHATINSTANCE_ENTITY_TYPE],
            menus: [UAI_ADDONS_MENU_ALIAS],
        },
    },
];
