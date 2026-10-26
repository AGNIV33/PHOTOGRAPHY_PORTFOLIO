import Link from "next/link";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { PostEditor, type EditablePost } from "@/components/admin/post-editor";
import { imageUrl } from "@/lib/cloudinary";
import { adminGetPost } from "@/lib/content";

function today() {
  // Local date in India, as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

async function Editor({ params, searchParams }: PageProps<"/admin/journal/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  let post: EditablePost;
  if (id === "new") {
    await io(); // today's date is read below
    post = { id: null, slug: null, title: "", excerpt: "", body: "", published_on: today(), status: "published", cover: null };
  } else {
    const row = /^[0-9a-f-]{36}$/i.test(id) ? await adminGetPost(id) : null;
    if (!row) notFound();
    post = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      published_on: row.published_on,
      status: row.status,
      cover: row.cover_public_id
        ? {
            public_id: row.cover_public_id,
            width: row.cover_width ?? 3,
            height: row.cover_height ?? 2,
            preview: imageUrl(row.cover_public_id, "thumb"),
          }
        : null,
    };
  }
  const notice =
    saved === "draft" ? "Saved as a draft. Only you can see it." : saved === "published" ? "Published. It is on the website now." : "";
  return (
    <div className="grid gap-6">
      <Link href="/admin/journal" className="label hover:text-[var(--ink)]">← All posts</Link>
      <PostEditor key={post.id ?? "new"} post={post} notice={notice} />
    </div>
  );
}

export default function PostAdminPage(props: PageProps<"/admin/journal/[id]">) {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/journal">
        <Editor {...props} />
      </AdminGate>
    </Suspense>
  );
}
