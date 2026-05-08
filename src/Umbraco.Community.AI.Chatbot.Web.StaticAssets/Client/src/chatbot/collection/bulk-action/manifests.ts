import { UMB_COLLECTION_ALIAS_CONDITION } from "@umbraco-cms/backoffice/collection";
import { UCAI_CHATINSTANCE_ENTITY_TYPE } from "../../constants.js";
import { UCAI_CHATINSTANCE_COLLECTION_ALIAS } from "../constants.js";

export const bulkActionManifests: Array<UmbExtensionManifest> = [
    {
        type: "entityBulkAction",
        kind: "default",
        alias: "Ucai.EntityBulkAction.ChatInstance.Delete",
        name: "Delete ChatInstances Bulk Action",
        weight: 100,
        api: () => import("./chatinstance-bulk-delete.action.js"),
        forEntityTypes: [UCAI_CHATINSTANCE_ENTITY_TYPE],
        meta: {
            icon: "icon-trash",
            label: "#actions_delete",
        },
        conditions: [
            {
                alias: UMB_COLLECTION_ALIAS_CONDITION,
                match: UCAI_CHATINSTANCE_COLLECTION_ALIAS,
            },
        ],
    },
];
