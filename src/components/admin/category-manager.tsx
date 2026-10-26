"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categorizePhoto, deleteCategory, photosNeedingCategories, renameCategory } from "@/app/admin/actions";
import { BW, COLOUR } from "@/lib/categories";

// Rename or remove categories everywhere at once, and let the site work out categories for
// photos that have none.
export function CategoryManager({ categories, ai, total }: { categories: [string, number][]; ai: boolean; total: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState("");

  async function run(fn: () => Promise<void>, done: string) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(done);
      setEditing(null);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function categorizeAll(all: boolean) {
    setBusy(true);
    setMsg("");
    try {
      const ids = await photosNeedingCategories(all);
      if (ids.length === 0) {
        setMsg("Every photo already has its categories.");
        return;
      }
      let failed = 0;
      let aiError = "";
      for (let i = 0; i < ids.length; i++) {
        setProgress(`Looking at photo ${i + 1} of ${ids.length}…`);
        try {
          const r = await categorizePhoto(ids[i]);
          if (r.aiError) aiError = r.aiError;
        } catch {
          failed++;
        }
      }
      const base = failed ? `Done. ${ids.length - failed} photos categorised, ${failed} could not be read.` : `Done. ${ids.length} photo${ids.length === 1 ? "" : "s"} categorised.`;
      setMsg(aiError ? `${base} Black & white / colour worked, but the AI step failed: ${aiError}` : base);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setProgress("");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8">
      <section className="admin-panel grid gap-3">
        <span className="kicker">Work them out automatically</span>
        <p className="text-[var(--ink-2)]">
          The site checks each picture: <strong>Black &amp; white</strong> or <strong>Colour</strong> is measured from the photo itself.
          {ai
            ? " AI also adds style categories such as Street, Nature or Landscape."
            : " Style categories (Street, Nature, Landscape…) need the Anthropic key to be set up; until then you add them by hand."}{" "}
          Categories you set yourself are always kept.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={busy || total === 0} onClick={() => categorizeAll(false)}>
            {busy && progress ? "Working…" : "Categorise photos that have none"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy || total === 0} onClick={() => categorizeAll(true)}>
            Check every photo again
          </button>
          {progress && <span className="text-[14px] text-[var(--ink-2)]" role="status">{progress}</span>}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="label">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} in use
          </span>
          <span className="text-[14px] text-[var(--ink-2)]">
            To put photos into a category, use <Link href="/admin" className="underline">My photos → Select photos</Link>.
          </span>
        </div>
        {msg && <p className="text-[14px] text-[var(--ink-2)]" role="status">{msg}</p>}
        {categories.length === 0 ? (
          <p className="text-[var(--ink-2)]">No categories yet. Use the button above, or add them to photos by hand.</p>
        ) : (
          <ul className="grid">
            {categories.map(([name, count]) => (
              <li key={name} className="cat-row">
                {editing === name ? (
                  <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(() => renameCategory(name, draft), `Renamed to “${draft.trim()}”.`);
                    }}
                  >
                    <input className="field" style={{ width: 240 }} value={draft} maxLength={30} onChange={(e) => setDraft(e.target.value)} aria-label={`New name for ${name}`} autoFocus />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !draft.trim()}>Save</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className="cat-name">
                      {name}
                      {(name === BW || name === COLOUR) && <small> · automatic</small>}
                    </span>
                    <span className="frame-no">{count} photo{count === 1 ? "" : "s"}</span>
                    <span className="flex gap-2">
                      <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setEditing(name); setDraft(name); }}>
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Remove the category “${name}”? The ${count} photo${count === 1 ? "" : "s"} stay on the website, they just lose this label.`)) return;
                          void run(() => deleteCategory(name), `Removed “${name}”.`);
                        }}
                      >
                        Remove
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
