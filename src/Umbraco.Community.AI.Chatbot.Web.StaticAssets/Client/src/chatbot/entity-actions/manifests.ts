import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "../constants.js";

export const entityActionManifests: Array<UmbExtensionManifest> = [
    {
        type: "entityAction",
        kind: "default",
        alias: "Ucai.EntityAction.ChatInstance.Delete",
        name: "Delete ChatInstance Entity Action",
        weight: 100,
        api: () => import("./chatinstance-delete.action.js"),
        forEntityTypes: [UCAI_CHATINSTANCE_ENTITY_TYPE],
        meta: {
            icon: "icon-trash",
            label: "#actions_delete",
        },
    },
];
