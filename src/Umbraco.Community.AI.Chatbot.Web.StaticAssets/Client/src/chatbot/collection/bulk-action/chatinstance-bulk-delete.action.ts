import { UmbEntityBulkActionBase } from "@umbraco-cms/backoffice/entity-bulk-action";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import { umbPeekError } from "@umbraco-cms/backoffice/notification";
import { UcaiChatInstanceDetailRepository } from "../../repository/detail/chatinstance-detail.repository.js";

export class UcaiChatInstanceBulkDeleteAction extends UmbEntityBulkActionBase<never> {
    async execute() {
        if (!this.selection || this.selection.length === 0) {
            throw new Error("No items selected.");
        }

        const count = this.selection.length;
        await umbConfirmModal(this, {
            headline: "Delete chat instances",
            content: `Delete ${count} chat instance${count === 1 ? "" : "s"}? This cannot be undone.`,
            color: "danger",
            confirmLabel: "Delete",
        });

        const repository = new UcaiChatInstanceDetailRepository(this);
        for (const unique of this.selection) {
            const { error } = await repository.delete(unique);
            if (error) {
                const problem = error as { title?: string; detail?: string };
                await umbPeekError(this, {
                    headline: problem.title ?? "Delete failed",
                    message:
                        problem.detail ??
                        problem.title ??
                        `"${unique}" could not be deleted.`,
                });
            }
        }
    }
}

export { UcaiChatInstanceBulkDeleteAction as api };
