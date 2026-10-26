"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { reorderAlbumPhotos } from "@/app/admin/actions";

type Item = { id: string; thumb: string; caption: string };

// The photos of one album, in the order visitors see them. One strip does both jobs:
// tap a photo to make it the album's cover, drag a photo to a new place to rearrange (the ← →
// buttons do the same on a phone). The order is saved as soon as you let go.
// A picture uploaded only as the cover is shown first and stays out of the order.
export function AlbumOrder({
  albumId,
  photos,
  coverOnly,
  coverId,
  onCover,
  disabled,
}: {
  albumId: string;
  photos: Item[];
  coverOnly?: Item | null;
  coverId: string | null;
  onCover: (photoId: string) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(photos);
  const latest = useRef(photos);
  // With no cover chosen, visitors see the first photo, so show that one as the cover.
  const activeCover = coverId ?? order[0]?.id ?? null;
  const [dragId, setDragId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const apply = (next: Item[]) => {
    latest.current = next;
    setOrder(next);
  };

  async function save() {
    setMsg("Saving the order…");
    try {
      await reorderAlbumPhotos(albumId, latest.current.map((p) => p.id));
      setMsg("Order saved.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save the order.");
    }
  }

  function nudge(id: string, by: -1 | 1) {
    const list = [...latest.current];
    const i = list.findIndex((p) => p.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    apply(list);
    void save();
  }

  // While dragging, the dragged photo moves to the side of the one it is over.
  function over(e: React.DragEvent<HTMLLIElement>, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const list = latest.current;
    const from = list.findIndex((p) => p.id === dragId);
    const to = list.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const after = e.clientX > box.left + box.width / 2;
    // Only move when it crosses the middle, so it does not flicker.
    if ((from < to && !after) || (from > to && after)) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(next.findIndex((p) => p.id === targetId) + (after ? 1 : 0), 0, moved);
    apply(next);
  }

  // Enter or Space on a photo makes it the cover (the photo is a div, not a button, because a
  // button inside a draggable item cannot be dragged in Firefox).
  const pickKey = (e: React.KeyboardEvent, act: () => void) => {
    if (disabled || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    act();
  };

  return (
    <div className="grid gap-2">
      <span className="label">Cover photo and order · tap one for the cover, drag to rearrange</span>
      <ol className="order-grid">
        {coverOnly && (
          <li className="order-item" data-fixed="">
            <div role="button" tabIndex={0} className="order-pick" aria-pressed={coverId === coverOnly.id} aria-disabled={disabled || undefined} onClick={() => !disabled && onCover(coverOnly.id)} onKeyDown={(e) => pickKey(e, () => onCover(coverOnly.id))} title="Use as the cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverOnly.thumb} alt="Cover picture (not shown in the gallery)" draggable={false} />
            </div>
            <span className="order-no">Cover only</span>
          </li>
        )}
        {order.map((p, i) => (
          <li
            key={p.id}
            className="order-item"
            data-dragging={dragId === p.id ? "" : undefined}
            draggable
            onDragStart={(e) => {
              setDragId(p.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", p.id);
            }}
            onDragOver={(e) => over(e, p.id)}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={() => {
              setDragId(null);
              void save();
            }}
          >
            <div role="button" tabIndex={0} className="order-pick" aria-pressed={activeCover === p.id} aria-disabled={disabled || undefined} onClick={() => !disabled && onCover(p.id)} onKeyDown={(e) => pickKey(e, () => onCover(p.id))} title="Use as the cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt={p.caption || `Photo ${i + 1}`} draggable={false} />
            </div>
            <span className="order-no">{String(i + 1).padStart(2, "0")}</span>
            {activeCover === p.id && <span className="order-cover">Cover</span>}
            <span className="order-arrows">
              <button type="button" onClick={() => nudge(p.id, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                ←
              </button>
              <button type="button" onClick={() => nudge(p.id, 1)} disabled={i === order.length - 1} aria-label={`Move photo ${i + 1} later`}>
                →
              </button>
            </span>
          </li>
        ))}
      </ol>
      {msg && (
        <span className="text-[14px] text-[var(--ink-2)]" role="status">
          {msg}
        </span>
      )}
    </div>
  );
}
