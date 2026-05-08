import { UmbEntityActionBase } from "@umbraco-cms/backoffice/entity-action";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import { umbPeekError } from "@umbraco-cms/backoffice/notification";
import { UcaiChatInstanceDetailRepository } from "../repository/detail/chatinstance-detail.repository.js";
import { UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH } from "../workspace/chatinstance-root/paths.js";

export class UcaiChatInstanceDeleteAction extends UmbEntityActionBase<never> {
    async execute() {
        if (!this.args.unique) {
            throw new Error("Cannot delete chat instance without a unique identifier.");
        }

        await umbConfirmModal(this, {
            headline: "Delete chat instance",
            content: `Delete chat instance "${this.args.unique}"? This cannot be undone.`,
            color: "danger",
            confirmLabel: "Delete",
        });

        const repository = new UcaiChatInstanceDetailRepository(this);
        const { error } = await repository.delete(this.args.unique);

        if (error) {
            const problem = error as { title?: string; detail?: string };
            await umbPeekError(this, {
                headline: problem.title ?? "Delete failed",
                message: problem.detail ?? problem.title ?? "The chat instance could not be deleted.",
            });
            throw error;
        }

        // If the user deleted the entity they were editing, the edit URL is now stale.
        // Send them back to the collection. (If they triggered delete from the list,
        // we're already there — pushState is a no-op semantically.)
        if (window.location.pathname.includes(`/edit/${encodeURIComponent(this.args.unique)}`)) {
            window.history.pushState({}, "", UCAI_CHATINSTANCE_ROOT_WORKSPACE_PATH);
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
    }
}

export { UcaiChatInstanceDeleteAction as api };
