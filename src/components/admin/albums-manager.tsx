"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAlbum, deleteAlbum, moveAlbum, setAlbumCover, updateAlbum } from "@/app/admin/actions";

type Album = {
  id: string;
  title: string;
  story: string;
  slug: string;
  cover_photo_id: string | null;
  photos: { id: string; thumb: string; caption: string }[];
};

function AlbumRowEditor({ album, index, total }: { album: Album; index: number; total: number }) {
  const router = useRouter();
  const [title, setTitle] = useState(album.title);
  const [story, setStory] = useState(album.story);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>, done?: string) =>
    start(async () => {
      try {
        await fn();
        setMsg(done ?? "");
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Something went wrong");
      }
    });

  return (
    <li className="admin-panel grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="frame-no">
          {String(index + 1).padStart(2, "0")} · {album.photos.length} photo{album.photos.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === 0} onClick={() => run(() => moveAlbum(album.id, -1))} aria-label="Move up">
            ↑ Up
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === total - 1} onClick={() => run(() => moveAlbum(album.id, 1))} aria-label="Move down">
            ↓ Down
          </button>
        </div>
      </div>
      <label className="grid gap-1.5">
        <span className="label">Album name</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="grid gap-1.5">
        <span className="label">Story (shown on the album page)</span>
        <textarea className="field" rows={3} value={story} onChange={(e) => setStory(e.target.value)} />
      </label>

      {album.photos.length > 0 && (
        <div className="grid gap-2">
          <span className="label">Cover photo (tap one)</span>
          <div className="cover-picker">
            {album.photos.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={album.cover_photo_id === p.id}
                title={p.caption || "Photo"}
                onClick={() => run(() => setAlbumCover(album.id, p.id), "Cover changed.")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt={p.caption} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px] text-[var(--ink-2)]" role="status">{msg}</span>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete the album "${album.title}"? The photos stay on the website, just without an album.`)) return;
              run(() => deleteAlbum(album.id));
            }}
          >
            Delete album
          </button>
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => run(() => updateAlbum(album.id, { title, story }), "Saved.")}>
            Save
          </button>
        </div>
      </div>
    </li>
  );
}

export function AlbumsManager({ albums }: { albums: Album[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-10">
      <form
        className="admin-panel grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              await createAlbum(title, story);
              setTitle("");
              setStory("");
              setError("");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not create album");
            }
          });
        }}
      >
        <span className="kicker">New album</span>
        <label className="grid gap-1.5">
          <span className="label">Album name</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kolkata Trams" required />
        </label>
        <label className="grid gap-1.5">
          <span className="label">Story (optional)</span>
          <textarea className="field" rows={3} value={story} onChange={(e) => setStory(e.target.value)} />
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Creating…" : "Create album"}
          </button>
          {error && <span className="text-[var(--safelight)]">{error}</span>}
        </div>
      </form>

      {albums.length === 0 ? (
        <p className="text-[var(--ink-2)]">No albums yet.</p>
      ) : (
        <ol className="grid gap-6">
          {albums.map((a, i) => (
            <AlbumRowEditor key={a.id} album={a} index={i} total={albums.length} />
          ))}
        </ol>
      )}
    </div>
  );
}
