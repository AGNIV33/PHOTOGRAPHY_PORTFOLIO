"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { getUploadSignature } from "@/app/admin/actions";
import { deletePost, discardCover, savePost, type PostInput } from "@/app/admin/content-actions";
import { uploadToCloudinary } from "@/lib/upload-client";

type Cover = NonNullable<PostInput["cover"]> & { preview: string };

export type EditablePost = {
  id: string | null;
  slug: string | null;
  title: string;
  excerpt: string;
  body: string;
  published_on: string;
  status: "draft" | "published";
  cover: Cover | null;
};

export function PostEditor({ post, notice = "" }: { post: EditablePost; notice?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [body, setBody] = useState(post.body);
  const [day, setDay] = useState(post.published_on);
  const [cover, setCover] = useState<Cover | null>(post.cover);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState(notice);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  // Covers uploaded in this visit; any that end up unused are deleted again.
  const uploaded = useRef<string[]>([]);

  async function pickCover(file: File | undefined) {
    if (!file) return;
    setError("");
    setProgress(0);
    try {
      const sig = await getUploadSignature();
      const up = await uploadToCloudinary(file, sig, setProgress);
      uploaded.current.push(up.public_id);
      setCover({ ...up, preview: URL.createObjectURL(file) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The photo could not be uploaded.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function save(status: PostInput["status"]) {
    setError("");
    setMsg("");
    start(async () => {
      try {
        const id = await savePost(post.id, {
          title,
          excerpt,
          body,
          published_on: day,
          status,
          cover: cover ? { public_id: cover.public_id, width: cover.width, height: cover.height } : null,
        });
        const unused = uploaded.current.filter((p) => p !== cover?.public_id);
        uploaded.current = [];
        await Promise.all(unused.map((p) => discardCover(p)));
        setMsg(status === "draft" ? "Saved as a draft. Only you can see it." : "Published. It is on the website now.");
        if (post.id) router.refresh();
        else router.replace(`/admin/journal/${id}?saved=${status}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="grid gap-8 max-w-3xl">
      <label className="grid gap-1.5">
        <span className="label">Title</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A morning on the tram" />
      </label>

      <label className="grid gap-1.5 max-w-xs">
        <span className="label">Date</span>
        <input className="field" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </label>

      <div className="grid gap-3">
        <span className="label">Cover photo (optional)</span>
        {cover ? (
          <div className="post-cover-edit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.preview} alt="" />
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={progress !== null}>
                Change photo
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCover(null)}>
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={progress !== null}>
              {progress === null ? "Choose a photo" : `Uploading… ${Math.round(progress * 100)}%`}
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickCover(e.target.files?.[0])} />
      </div>

      <label className="grid gap-1.5">
        <span className="label">Short summary (shown in the Journal list)</span>
        <textarea className="field" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </label>

      <label className="grid gap-1.5">
        <span className="label">The story</span>
        <textarea className="field post-body-field" rows={16} value={body} onChange={(e) => setBody(e.target.value)} />
        <span className="text-[14px] text-[var(--ink-2)]">Leave an empty line between paragraphs.</span>
      </label>

      <div className="publish-bar">
        <span className="text-[14px] mr-auto" role="status">
          {error ? <span className="text-[var(--safelight)]">{error}</span> : msg}
        </span>
        {post.id && (
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete the post "${post.title}"? This cannot be undone.`)) return;
              start(async () => {
                try {
                  await deletePost(post.id!);
                  router.replace("/admin/journal");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not delete");
                }
              });
            }}
          >
            Delete post
          </button>
        )}
        {post.id && post.status === "published" && post.slug && (
          <Link href={`/blog/${post.slug}`} className="btn btn-ghost" target="_blank">
            View on website
          </Link>
        )}
        <button type="button" className="btn btn-ghost" disabled={pending || progress !== null} onClick={() => save("draft")}>
          Save as draft
        </button>
        <button type="button" className="btn btn-primary" disabled={pending || progress !== null} onClick={() => save("published")}>
          {pending ? "Saving…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
