import { manifests as rootManifests } from "./chatinstance-root/manifests.js";
import { manifests as detailManifests } from "./chatinstance/manifests.js";

export const workspaceManifests: Array<UmbExtensionManifest> = [
    ...rootManifests,
    ...detailManifests,
];
