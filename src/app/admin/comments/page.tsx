import Link from "next/link";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { CommentActions } from "@/components/admin/comment-actions";
import { adminListComments, adminListPhotos } from "@/lib/photos";

async function Comments() {
  const [comments, photos] = await Promise.all([adminListComments(), adminListPhotos()]);
  const caption = new Map(photos.map((p) => [p.id, p.caption || "Untitled photo"]));

  if (comments.length === 0) return <p className="serif text-[28px]">No comments yet.</p>;

  return (
    <ul className="grid">
      {comments.map((c) => (
        <li key={c.id} className="grid gap-2 border-b border-[var(--hairline)] py-5" data-hidden={c.hidden || undefined}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-semibold">
              {c.author_name}
              {c.hidden && <span className="badge ml-2">Hidden</span>}
            </span>
            <span className="text-[13px] text-[var(--muted)]">
              on{" "}
              <Link href={`/photo/${c.photo_id}`} className="underline">
                {caption.get(c.photo_id) ?? "a photo"}
              </Link>{" "}
              · {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className={c.hidden ? "text-[var(--muted)]" : ""}>{c.body}</p>
          <CommentActions id={c.id} hidden={c.hidden} />
        </li>
      ))}
    </ul>
  );
}

export default function CommentsAdminPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/comments">
        <Comments />
      </AdminGate>
    </Suspense>
  );
}
