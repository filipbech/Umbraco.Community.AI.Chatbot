import type { UmbCollectionFilterModel, UmbCollectionRepository } from "@umbraco-cms/backoffice/collection";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbRepositoryBase } from "@umbraco-cms/backoffice/repository";
import { UcaiChatInstanceCollectionServerDataSource } from "./chatinstance-collection.server.data-source.js";

export class UcaiChatInstanceCollectionRepository extends UmbRepositoryBase implements UmbCollectionRepository {
    #source: UcaiChatInstanceCollectionServerDataSource;

    constructor(host: UmbControllerHost) {
        super(host);
        this.#source = new UcaiChatInstanceCollectionServerDataSource(host);
    }

    async requestCollection(filter: UmbCollectionFilterModel) {
        return this.#source.getCollection(filter);
    }
}

export { UcaiChatInstanceCollectionRepository as api };
