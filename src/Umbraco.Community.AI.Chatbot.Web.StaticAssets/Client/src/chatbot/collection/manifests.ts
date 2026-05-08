import { UCAI_CHATINSTANCE_COLLECTION_ALIAS } from "./constants.js";
import { UCAI_CHATINSTANCE_COLLECTION_REPOSITORY_ALIAS } from "../repository/constants.js";
import { bulkActionManifests } from "./bulk-action/manifests.js";

export const collectionManifests: Array<UmbExtensionManifest> = [
    ...bulkActionManifests,
    {
        type: "collection",
        kind: "default",
        alias: UCAI_CHATINSTANCE_COLLECTION_ALIAS,
        name: "ChatInstance Collection",
        element: () => import("./chatinstance-collection.element.js"),
        meta: {
            repositoryAlias: UCAI_CHATINSTANCE_COLLECTION_REPOSITORY_ALIAS,
        },
    },
    {
        type: "collectionView",
        alias: "Ucai.CollectionView.ChatInstance.Table",
        name: "ChatInstance Table View",
        element: () => import("./views/table/chatinstance-table-collection-view.element.js"),
        meta: {
            label: "Table",
            icon: "icon-list",
            pathName: "table",
        },
        conditions: [
            { alias: "Umb.Condition.CollectionAlias", match: UCAI_CHATINSTANCE_COLLECTION_ALIAS },
        ],
    },
    {
        type: "collectionAction",
        alias: "Ucai.CollectionAction.ChatInstance.Create",
        name: "Create ChatInstance",
        element: () => import("./action/chatinstance-create-collection-action.element.js"),
        conditions: [
            { alias: "Umb.Condition.CollectionAlias", match: UCAI_CHATINSTANCE_COLLECTION_ALIAS },
        ],
    },
];
