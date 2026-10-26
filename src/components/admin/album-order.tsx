"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { reorderAlbumPhotos } from "@/app/admin/actions";

type Item = { id: string; thumb: string; caption: string };

// The photos of one album in the order visitors see them. Drag a photo to a new place, or use
// the arrows (they also work on a phone). The order is saved as soon as you let go.
export function AlbumOrder({ albumId, photos }: { albumId: string; photos: Item[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(photos);
  const latest = useRef(photos);
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

  return (
    <div className="grid gap-2">
      <span className="label">Order of the photos · drag to rearrange</span>
      <ol className="order-grid">
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt={p.caption || `Photo ${i + 1}`} draggable={false} />
            <span className="order-no">{String(i + 1).padStart(2, "0")}</span>
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
