"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteAchievement,
  fetchLinkPreview,
  getPreviewUploadSignature,
  moveAchievement,
  saveAchievement,
  type AchievementInput,
} from "@/app/admin/content-actions";
import { uploadToCloudinary } from "@/lib/upload-client";

export type AchievementItem = {
  id: string;
  year: string;
  title: string;
  detail: string;
  link: string;
  link_site: string;
  link_title: string;
  link_description: string;
  // Stored picture: its id and a link to show it.
  image_id: string;
  image_url: string;
};

// What the card's picture will be when saved.
type Picture =
  | { kind: "none" }
  | { kind: "saved"; public_id: string; show: string }
  | { kind: "remote"; url: string; show: string };

const blank: AchievementItem = {
  id: "",
  year: "",
  title: "",
  detail: "",
  link: "",
  link_site: "",
  link_title: "",
  link_description: "",
  image_id: "",
  image_url: "",
};

function Editor({ item, index, total }: { item: AchievementItem; index?: number; total?: number }) {
  const router = useRouter();
  const isNew = !item.id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [v, setV] = useState(item);
  const [picture, setPicture] = useState<Picture>(
    item.image_id ? { kind: "saved", public_id: item.image_id, show: item.image_url } : { kind: "none" },
  );
  const [looking, setLooking] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof AchievementItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((cur) => ({ ...cur, [k]: e.target.value }));

  const hasPreview = Boolean(v.link_title || v.link_description || picture.kind !== "none");

  async function getPreview() {
    setError("");
    setNote("");
    setLooking(true);
    const res = await fetchLinkPreview(v.link);
    setLooking(false);
    if (!res.preview || !res.link) return setError(res.error ?? "The link could not be read.");
    const p = res.preview;
    setV((cur) => ({ ...cur, link: res.link, link_site: p.site, link_title: p.title, link_description: p.description }));
    setPicture(p.image ? { kind: "remote", url: p.image, show: p.image } : { kind: "none" });
    setNote(
      p.note ??
        "Preview found. You can change the words or the picture below, then press Save.",
    );
  }

  async function pickPicture(file: File | undefined) {
    if (!file) return;
    setError("");
    setProgress(0);
    try {
      const sig = await getPreviewUploadSignature();
      const up = await uploadToCloudinary(file, sig, setProgress);
      setPicture({ kind: "saved", public_id: up.public_id, show: URL.createObjectURL(file) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The picture could not be uploaded.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function save() {
    setError("");
    setNote("");
    start(async () => {
      try {
        const input: AchievementInput = {
          year: v.year,
          title: v.title,
          detail: v.detail,
          link: v.link,
          link_site: v.link_site,
          link_title: v.link_title,
          link_description: v.link_description,
          image:
            picture.kind === "saved"
              ? { public_id: picture.public_id }
              : picture.kind === "remote"
                ? { remote_url: picture.url }
                : null,
        };
        const res = await saveAchievement(item.id || null, input);
        setNote(res.warning ?? (isNew ? "Added." : "Saved."));
        if (isNew) {
          setV(blank);
          setPicture({ kind: "none" });
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <li className="admin-panel grid gap-5 list-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={isNew ? "kicker" : "frame-no"}>{isNew ? "Add achievement" : String(index! + 1).padStart(2, "0")}</span>
        {!isNew && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === 0} onClick={() => start(async () => { await moveAchievement(item.id, -1); router.refresh(); })}>
              ↑ Up
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={pending || index === total! - 1} onClick={() => start(async () => { await moveAchievement(item.id, 1); router.refresh(); })}>
              ↓ Down
            </button>
          </div>
        )}
      </div>

      <div className="list-fields">
        <label className="grid gap-1.5">
          <span className="label">Year</span>
          <input className="field" value={v.year} onChange={set("year")} placeholder="2024" />
        </label>
        <label className="grid gap-1.5 list-fields-full">
          <span className="label">What it is</span>
          <input className="field" value={v.title} onChange={set("title")} placeholder="First prize, Kolkata Street Photo Festival" />
        </label>
        <label className="grid gap-1.5 list-fields-full">
          <span className="label">More details (optional)</span>
          <textarea className="field" rows={2} value={v.detail} onChange={set("detail")} />
        </label>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="label">Link to the post or article (optional)</span>
          <div className="flex flex-wrap gap-3">
            <input
              className="field flex-1 min-w-[220px]"
              value={v.link}
              onChange={(e) => {
                setV((cur) => ({ ...cur, link: e.target.value }));
              }}
              placeholder="https://www.facebook.com/…"
              inputMode="url"
            />
            <button type="button" className="btn btn-ghost" disabled={!v.link.trim() || looking} onClick={getPreview}>
              {looking ? "Looking…" : "Get preview"}
            </button>
          </div>
        </label>

        {v.link.trim() && (
          <div className="link-edit">
            <div className="link-edit-pic">
              {picture.kind !== "none" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picture.show} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="label">No picture</span>
              )}
            </div>
            <div className="grid gap-3 content-start">
              <label className="grid gap-1.5">
                <span className="label">Card title</span>
                <input className="field" value={v.link_title} onChange={set("link_title")} placeholder="Shown on the card" />
              </label>
              <label className="grid gap-1.5">
                <span className="label">Card text</span>
                <textarea className="field" rows={2} value={v.link_description} onChange={set("link_description")} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-ghost btn-sm" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
                  {progress !== null ? `Uploading… ${Math.round(progress * 100)}%` : picture.kind === "none" ? "Upload a picture" : "Change picture"}
                </button>
                {picture.kind !== "none" && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicture({ kind: "none" })}>
                    Remove picture
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPicture(e.target.files?.[0])} />
            </div>
          </div>
        )}
        {v.link.trim() && !hasPreview && (
          <p className="text-[14px] text-[var(--ink-2)]">
            Without a preview, visitors still see a clean card with the link. You can write a card title and upload a picture yourself.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px]" role="status">
          {error ? <span className="text-[var(--safelight)]">{error}</span> : <span className="text-[var(--ink-2)]">{note}</span>}
        </span>
        <div className="flex gap-3">
          {!isNew && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
                start(async () => {
                  try {
                    await deleteAchievement(item.id);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not delete");
                  }
                });
              }}
            >
              Delete
            </button>
          )}
          <button type="button" className="btn btn-primary" disabled={pending || progress !== null} onClick={save}>
            {pending ? "Saving…" : isNew ? "Add achievement" : "Save"}
          </button>
        </div>
      </div>
    </li>
  );
}

export function AchievementsManager({ items }: { items: AchievementItem[] }) {
  return (
    <div className="grid gap-10 max-w-3xl">
      <ol className="grid">
        <Editor item={blank} />
      </ol>
      {items.length === 0 ? (
        <p className="text-[var(--ink-2)]">Nothing added yet.</p>
      ) : (
        <ol className="grid gap-6">
          {items.map((it, i) => (
            <Editor key={it.id} item={it} index={i} total={items.length} />
          ))}
        </ol>
      )}
    </div>
  );
}
