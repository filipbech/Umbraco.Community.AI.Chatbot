import { UmbDetailStoreBase } from "@umbraco-cms/backoffice/store";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import type { UcaiChatInstanceDetailModel } from "../../types.js";

export const UCAI_CHATINSTANCE_DETAIL_STORE_CONTEXT = new UmbContextToken<UcaiChatInstanceDetailStore>(
    "UcaiChatInstanceDetailStore",
);

export class UcaiChatInstanceDetailStore extends UmbDetailStoreBase<UcaiChatInstanceDetailModel> {
    constructor(host: UmbControllerHost) {
        super(host, UCAI_CHATINSTANCE_DETAIL_STORE_CONTEXT.toString());
    }
}

export { UcaiChatInstanceDetailStore as api };
