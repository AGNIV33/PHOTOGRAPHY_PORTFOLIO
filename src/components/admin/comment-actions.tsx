"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteComment, setCommentHidden } from "@/app/admin/actions";

export function CommentActions({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      router.refresh();
    });
  return (
    <div className="flex gap-4 text-[14px]">
      <button type="button" className="underline text-[var(--ink-2)] disabled:opacity-50" disabled={pending} onClick={() => run(() => setCommentHidden(id, !hidden))}>
        {hidden ? "Show again" : "Hide"}
      </button>
      <button
        type="button"
        className="underline text-[var(--safelight)] disabled:opacity-50"
        disabled={pending}
        onClick={() => window.confirm("Delete this comment for good?") && run(() => deleteComment(id))}
      >
        Delete
      </button>
    </div>
  );
}
