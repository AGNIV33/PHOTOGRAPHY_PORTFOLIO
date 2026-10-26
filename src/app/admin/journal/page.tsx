import Link from "next/link";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { adminListPosts, formatDay } from "@/lib/content";

async function Posts() {
  const posts = await adminListPosts();
  return (
    <div className="grid gap-8 max-w-3xl">
      <div>
        <Link href="/admin/journal/new" className="btn btn-primary">
          Write a new post
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-[var(--ink-2)]">No posts yet. Your stories will be listed here.</p>
      ) : (
        <ol className="border-t border-[var(--hairline)]">
          {posts.map((p) => (
            <li key={p.id} className="border-b border-[var(--hairline)]">
              <Link href={`/admin/journal/${p.id}`} className="group grid gap-1 py-5">
                <span className="frame-no">
                  {formatDay(p.published_on)}
                  {p.status === "draft" ? " · Draft (only you can see it)" : ""}
                </span>
                <span className="serif text-[26px] leading-tight group-hover:text-[var(--safelight)]">{p.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function JournalAdminPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/journal">
        <Posts />
      </AdminGate>
    </Suspense>
  );
}
