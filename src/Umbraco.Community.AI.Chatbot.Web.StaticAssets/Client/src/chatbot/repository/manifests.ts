import type { ManifestRepository, ManifestStore } from "@umbraco-cms/backoffice/extension-registry";
import {
    UCAI_CHATINSTANCE_COLLECTION_REPOSITORY_ALIAS,
    UCAI_CHATINSTANCE_DETAIL_REPOSITORY_ALIAS,
    UCAI_CHATINSTANCE_DETAIL_STORE_ALIAS,
} from "./constants.js";

export const repositoryManifests: Array<ManifestRepository | ManifestStore> = [
    {
        type: "repository",
        alias: UCAI_CHATINSTANCE_DETAIL_REPOSITORY_ALIAS,
        name: "ChatInstance Detail Repository",
        api: () => import("./detail/chatinstance-detail.repository.js"),
    },
    {
        type: "store",
        alias: UCAI_CHATINSTANCE_DETAIL_STORE_ALIAS,
        name: "ChatInstance Detail Store",
        api: () => import("./detail/chatinstance-detail.store.js"),
    },
    {
        type: "repository",
        alias: UCAI_CHATINSTANCE_COLLECTION_REPOSITORY_ALIAS,
        name: "ChatInstance Collection Repository",
        api: () => import("./collection/chatinstance-collection.repository.js"),
    },
];
