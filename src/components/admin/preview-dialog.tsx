"use client";

import { useEffect, useRef, useState } from "react";

export type PreviewItem = {
  key: string;
  src: string;
  ratio: number; // width / height
  caption: string;
  place: string;
  tags: string[];
  members: boolean;
  album?: string;
};

// "This is how it will look": the same grid visitors see on the Work page, with the pictures
// that are about to be published. Nothing is saved until the confirm button is pressed.
export function PreviewDialog({
  items,
  title = "Preview",
  note,
  confirmLabel,
  busy,
  onClose,
  onConfirm,
}: {
  items: PreviewItem[];
  title?: string;
  note?: string;
  confirmLabel: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [big, setBig] = useState<number | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (big !== null) setBig(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [big, onClose]);

  const open = big !== null ? items[big] : null;

  return (
    <div className="preview-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className="preview-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="preview-head">
          <div className="grid gap-1">
            <span className="kicker">{title}</span>
            <p className="text-[var(--ink-2)]">{note ?? "This is how it will look on the website. Tap a photo to see it larger."}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="preview-body" data-lenis-prevent>
          {items.length === 0 ? (
            <p className="text-[var(--ink-2)]">Nothing to preview yet.</p>
          ) : (
            <div className="justified">
              {items.map((it, i) => (
                <figure key={it.key} className="tile" style={{ "--r": it.ratio } as React.CSSProperties}>
                  <button type="button" className="tile-link preview-tile" onClick={() => setBig(i)} aria-label={it.caption || `Photo ${i + 1}`}>
                    <span className="protected" style={{ aspectRatio: String(it.ratio) }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.src} alt="" />
                      {it.members && <span className="badge preview-badge">Members</span>}
                    </span>
                  </button>
                  <figcaption className="frame-meta">
                    <span className="frame-caption">{it.caption}</span>
                    <span className="frame-no">
                      {String(i + 1).padStart(2, "0")}
                      {it.place ? ` · ${it.place}` : ""}
                    </span>
                  </figcaption>
                  {it.tags.length > 0 && <span className="preview-tags">{it.tags.join(" · ")}</span>}
                </figure>
              ))}
            </div>
          )}
        </div>

        <footer className="preview-foot">
          <span className="text-[var(--ink-2)]">
            {items.length} photo{items.length === 1 ? "" : "s"}
            {items.some((i) => i.members) ? " · members-only photos are blurred for people who are not signed in" : ""}
          </span>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Keep editing
            </button>
            <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy || items.length === 0}>
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </footer>

        {open && (
          <div className="preview-big" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setBig(null)} data-lenis-prevent>
            <figure className="preview-big-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.src} alt={open.caption} />
              <figcaption className="grid gap-1">
                <span className="serif text-[26px]">{open.caption || "No caption"}</span>
                <span className="label">
                  {[open.place, open.album && `Album: ${open.album}`, open.members && "Members only"].filter(Boolean).join(" · ") || "No place"}
                </span>
                {open.tags.length > 0 && <span className="preview-tags">{open.tags.join(" · ")}</span>}
              </figcaption>
              <button type="button" className="btn btn-ghost btn-sm justify-self-start" onClick={() => setBig(null)}>
                Back to the grid
              </button>
            </figure>
          </div>
        )}
      </div>
    </div>
  );
}
