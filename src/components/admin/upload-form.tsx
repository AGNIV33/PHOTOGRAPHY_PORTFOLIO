"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  createAlbum,
  createPhoto,
  getUploadSignature,
  type PhotoInput,
} from "@/app/admin/actions";
import { Select } from "@/components/select";
import { readCameraDetails } from "@/lib/exif";
import { uploadToCloudinary } from "@/lib/upload-client";
import { PhotoFields, type AlbumOption } from "./photo-fields";

type Item = {
  key: string;
  file: File;
  preview: string;
  input: PhotoInput;
  state: "ready" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

const blank: PhotoInput = {
  caption: "",
  place: "",
  taken_at: null,
  camera: "",
  lens: "",
  focal_length: "",
  aperture: "",
  shutter: "",
  iso: "",
  album_id: null,
  visibility: "public",
  status: "published",
};

export function UploadForm({ albums: initialAlbums }: { albums: AlbumOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [albums, setAlbums] = useState(initialAlbums);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  // Album and "who can see" chosen once at the top apply to every photo picked.
  const [shared, setShared] = useState({ album_id: null as string | null, visibility: "public" as PhotoInput["visibility"] });

  const update = (key: string, patch: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  async function onPick(files: FileList | null) {
    if (!files) return;
    const picked = await Promise.all(
      Array.from(files)
        .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
        .map(async (file) => {
          const details = await readCameraDetails(file);
          return {
            key: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            preview: URL.createObjectURL(file),
            input: { ...blank, ...shared, ...details, taken_at: details.taken_at || null },
            state: "ready" as const,
            progress: 0,
          };
        }),
    );
    setItems((list) => [...list, ...picked.filter((p) => !list.some((it) => it.key === p.key))]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function newAlbum() {
    const title = window.prompt("Name of the new album (for example: Kolkata Trams)");
    if (!title?.trim()) return null;
    const id = await createAlbum(title, "");
    setAlbums((a) => [...a, { id, title: title.trim() }]);
    return id;
  }

  function applyShared(patch: Partial<typeof shared>) {
    const next = { ...shared, ...patch };
    setShared(next);
    setItems((list) => list.map((it) => (it.state === "done" ? it : { ...it, input: { ...it.input, ...patch } })));
  }

  async function publish(status: PhotoInput["status"]) {
    setBusy(true);
    const todo = items.filter((it) => it.state === "ready" || it.state === "error");
    // The gallery shows the newest upload first. Uploading the list from the bottom up keeps
    // the order he picked: the first photo in the list ends up on top.
    for (const it of [...todo].reverse()) {
      update(it.key, { state: "uploading", progress: 0, error: undefined });
      try {
        const sig = await getUploadSignature();
        const uploaded = await uploadToCloudinary(it.file, sig, (p) => update(it.key, { progress: p }));
        await createPhoto(uploaded, { ...it.input, status });
        update(it.key, { state: "done", progress: 1 });
      } catch (e) {
        update(it.key, { state: "error", error: e instanceof Error ? e.message : "Something went wrong" });
      }
    }
    setBusy(false);
    router.refresh();
  }

  const pending = items.filter((it) => it.state !== "done").length;
  const done = items.filter((it) => it.state === "done").length;

  return (
    <div className="grid gap-8">
      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files);
        }}
      >
        <p className="serif text-[26px]">Pick one or many photos</p>
        <p className="text-[var(--ink-2)]">
          From this computer or phone. Camera, lens, settings and date fill in by themselves.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          Choose photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <>
          <div className="admin-panel grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="label">Album for all these photos</span>
              <div className="flex gap-2">
                <Select
                  variant="box"
                  className="flex-1"
                  ariaLabel="Album for all these photos"
                  value={shared.album_id ?? ""}
                  onChange={(v) => applyShared({ album_id: v || null })}
                  options={[{ value: "", label: "No album" }, ...albums.map((a) => ({ value: a.id, label: a.title }))]}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={async () => {
                    const id = await newAlbum();
                    if (id) applyShared({ album_id: id });
                  }}
                >
                  New album
                </button>
              </div>
            </label>
            <fieldset className="grid gap-1.5">
              <legend className="label mb-1.5">Who can see all these photos</legend>
              <div className="choice-row">
                <label className="choice">
                  <input
                    type="radio"
                    name="shared-vis"
                    checked={shared.visibility === "public"}
                    onChange={() => applyShared({ visibility: "public" })}
                  />
                  <span>Everyone</span>
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="shared-vis"
                    checked={shared.visibility === "members"}
                    onChange={() => applyShared({ visibility: "members" })}
                  />
                  <span>Members only</span>
                </label>
              </div>
            </fieldset>
          </div>

          <ol className="grid gap-6">
            {items.map((it, i) => (
              <li key={it.key} className="upload-item" data-state={it.state}>
                <div className="upload-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  <span className="frame-no">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="grid gap-4 content-start">
                  {it.state === "done" ? (
                    <p className="serif text-[22px]">Published. {it.input.caption || it.file.name}</p>
                  ) : (
                    <PhotoFields
                      idPrefix={`up-${i}`}
                      value={it.input}
                      albums={albums}
                      onChange={(input) => update(it.key, { input })}
                      onNewAlbum={async () => {
                        const id = await newAlbum();
                        if (id) update(it.key, { input: { ...it.input, album_id: id } });
                      }}
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    {it.state === "uploading" && (
                      <span className="progress" aria-label="Uploading">
                        <i style={{ transform: `scaleX(${it.progress})` }} />
                      </span>
                    )}
                    {it.state === "error" && <span className="text-[var(--safelight)]">{it.error}</span>}
                    {(it.state === "ready" || it.state === "error") && (
                      <button
                        type="button"
                        className="text-[14px] text-[var(--ink-2)] underline"
                        onClick={() => setItems((list) => list.filter((x) => x.key !== it.key))}
                      >
                        Remove from list
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="publish-bar">
            <span className="text-[var(--ink-2)]">
              {pending > 0 ? `${pending} photo${pending > 1 ? "s" : ""} ready` : "All published"}
              {done > 0 && pending > 0 ? ` · ${done} published` : ""}
            </span>
            <div className="flex gap-3">
              {pending > 0 ? (
                <>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => publish("draft")}>
                    Save as draft
                  </button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => publish("published")}>
                    {busy ? "Uploading…" : "Publish"}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => setItems([])}>
                    Add more photos
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => router.push("/admin")}>
                    See all my photos
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
