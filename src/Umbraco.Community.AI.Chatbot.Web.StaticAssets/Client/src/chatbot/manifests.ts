import { menuManifests } from "./menu/manifests.js";
import { repositoryManifests } from "./repository/manifests.js";
import { collectionManifests } from "./collection/manifests.js";
import { workspaceManifests } from "./workspace/manifests.js";
import { entityActionManifests } from "./entity-actions/manifests.js";

export const agentChatManifests: Array<UmbExtensionManifest> = [
    ...menuManifests,
    ...repositoryManifests,
    ...collectionManifests,
    ...workspaceManifests,
    ...entityActionManifests,
];
