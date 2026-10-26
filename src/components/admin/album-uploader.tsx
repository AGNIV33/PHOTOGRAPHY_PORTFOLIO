"use client";

import { useRef, useState } from "react";
import { createPhoto, getUploadSignature, setAlbumCover, type PhotoInput } from "@/app/admin/actions";
import { detectColour, fileRatio } from "@/lib/detect-colour";
import { readCameraDetails } from "@/lib/exif";
import { uploadToCloudinary } from "@/lib/upload-client";
import { PreviewDialog } from "./preview-dialog";

// Many photos at once into one album, plus the album's cover: one of those photos, or a
// separate picture that is used only as the cover (it never shows in the gallery).

type Picked = { key: string; file: File; preview: string; ratio: number; tags: string[]; details: Partial<PhotoInput> };
type Separate = { file: File; preview: string };

const isImage = (f: File) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);

export function useAlbumUploader() {
  const [items, setItems] = useState<Picked[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [separate, setSeparate] = useState<Separate | null>(null);
  const [members, setMembers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function pickPhotos(files: FileList | File[] | null) {
    if (!files) return;
    const picked = await Promise.all(
      Array.from(files)
        .filter(isImage)
        .map(async (file) => {
          const [details, colour, ratio] = await Promise.all([readCameraDetails(file), detectColour(file), fileRatio(file)]);
          return {
            key: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            preview: URL.createObjectURL(file),
            ratio,
            tags: colour ? [colour] : [],
            details: { ...details, taken_at: details.taken_at || null } as Partial<PhotoInput>,
          };
        }),
    );
    setItems((list) => [...list, ...picked.filter((p) => !list.some((x) => x.key === p.key))]);
  }

  function pickSeparate(file: File | null | undefined) {
    if (!file || !isImage(file)) return;
    setSeparate({ file, preview: URL.createObjectURL(file) });
    setCoverKey(null);
  }

  const remove = (key: string) => {
    setItems((list) => list.filter((x) => x.key !== key));
    setCoverKey((k) => (k === key ? null : k));
  };

  const hasContent = items.length > 0 || separate !== null;

  // Uploads everything into the album and sets its cover. Photos are sent from the bottom of
  // the list up, so the first photo ends up newest, like the normal upload page.
  async function uploadInto(albumId: string) {
    setBusy(true);
    setError("");
    const ids = new Map<string, string>();
    try {
      const total = items.length + (separate ? 1 : 0);
      let done = 0;
      for (const it of [...items].reverse()) {
        setStatus(`Uploading photo ${done + 1} of ${total}…`);
        const sig = await getUploadSignature();
        const uploaded = await uploadToCloudinary(it.file, sig, () => {});
        const input: PhotoInput = {
          caption: "",
          place: "",
          taken_at: null,
          camera: "",
          lens: "",
          focal_length: "",
          aperture: "",
          shutter: "",
          iso: "",
          ...it.details,
          album_id: albumId,
          visibility: members ? "members" : "public",
          status: "published",
          tags: it.tags,
        };
        ids.set(it.key, await createPhoto(uploaded, input));
        done++;
      }
      let cover: string | null = null;
      if (separate) {
        setStatus(`Uploading the cover picture…`);
        const sig = await getUploadSignature();
        const uploaded = await uploadToCloudinary(separate.file, sig, () => {});
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
          album_id: albumId,
          visibility: "public",
          status: "draft", // hidden from the gallery: it is only the album's cover
          tags: [],
        };
        cover = await createPhoto(uploaded, blank, { analyze: false });
      } else if (items.length > 0) {
        cover = ids.get(coverKey ?? items[0].key) ?? null;
      }
      if (cover) await setAlbumCover(albumId, cover);
      setStatus("");
      setItems([]);
      setSeparate(null);
      setCoverKey(null);
      return { added: items.length, cover: Boolean(cover) };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while uploading.");
      setStatus("");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return { items, coverKey, setCoverKey, separate, setSeparate, members, setMembers, busy, status, error, pickPhotos, pickSeparate, remove, hasContent, uploadInto };
}

export type AlbumUploader = ReturnType<typeof useAlbumUploader>;

export function AlbumUploaderPanel({ ctl, albumTitle, allowCoverOnly }: { ctl: AlbumUploader; albumTitle: string; allowCoverOnly?: boolean }) {
  const photoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const firstKey = ctl.items[0]?.key;
  const activeCover = ctl.separate ? null : (ctl.coverKey ?? firstKey ?? null);

  return (
    <div className="grid gap-4">
      <div
        className="album-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void ctl.pickPhotos(e.dataTransfer.files);
        }}
      >
        <div className="grid gap-1">
          <span className="label">Photos for this album (as many as you like)</span>
          <span className="text-[14px] text-[var(--ink-2)]">Choose many at once, or drop them here.</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={ctl.busy} onClick={() => photoInput.current?.click()}>
          Choose photos
        </button>
        <input
          ref={photoInput}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            void ctl.pickPhotos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {ctl.items.length > 0 && (
        <div className="grid gap-2">
          <span className="label">
            {ctl.items.length} photo{ctl.items.length === 1 ? "" : "s"} · tap one to make it the cover
          </span>
          <div className="cover-picker">
            {ctl.items.map((it) => (
              <div key={it.key} className="picked-thumb">
                <button type="button" aria-pressed={activeCover === it.key} onClick={() => ctl.setCoverKey(it.key)} title="Use as the cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} alt="" />
                </button>
                <button type="button" className="picked-remove" onClick={() => ctl.remove(it.key)} aria-label="Take this photo off the list" disabled={ctl.busy}>
                  ×
                </button>
              </div>
            ))}
          </div>
          <fieldset className="choice-row">
            <legend className="sr-only">Who can see these photos</legend>
            <label className="choice">
              <input type="radio" name={`vis-${albumTitle}`} checked={!ctl.members} onChange={() => ctl.setMembers(false)} />
              <span>Everyone</span>
            </label>
            <label className="choice">
              <input type="radio" name={`vis-${albumTitle}`} checked={ctl.members} onChange={() => ctl.setMembers(true)} />
              <span>Members only</span>
            </label>
          </fieldset>
        </div>
      )}

      <div className="grid gap-2">
        <span className="label">Cover picture</span>
        <p className="text-[14px] text-[var(--ink-2)]">
          {ctl.separate
            ? "This picture will be the cover. It is only used as the album's cover and does not appear in the gallery."
            : allowCoverOnly
              ? "Use one of the photos above, or upload a separate picture from this computer."
              : "The first photo is the cover unless you tap another one. Or upload a separate picture from this computer."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {ctl.separate && (
            <span className="picked-thumb">
              <span className="picked-fixed">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ctl.separate.preview} alt="Chosen cover picture" />
              </span>
            </span>
          )}
          <button type="button" className="btn btn-ghost btn-sm" disabled={ctl.busy} onClick={() => coverInput.current?.click()}>
            {ctl.separate ? "Choose a different picture" : "Upload a separate cover"}
          </button>
          {ctl.separate && (
            <button type="button" className="text-[14px] text-[var(--ink-2)] underline" onClick={() => ctl.setSeparate(null)} disabled={ctl.busy}>
              Use one of the photos instead
            </button>
          )}
          <input
            ref={coverInput}
            type="file"
            accept="image/*,.heic,.heif"
            hidden
            onChange={(e) => {
              ctl.pickSeparate(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {ctl.items.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={ctl.busy} onClick={() => setPreviewing(true)}>
            Preview
          </button>
        )}
        {ctl.status && <span className="text-[14px] text-[var(--ink-2)]" role="status">{ctl.status}</span>}
        {ctl.error && <span className="text-[14px] text-[var(--safelight)]" role="alert">{ctl.error}</span>}
      </div>

      {previewing && (
        <PreviewDialog
          title={`Preview: ${albumTitle || "new album"}`}
          note="These photos will be added to the album. Tap one to see it larger."
          confirmLabel="Looks good"
          onClose={() => setPreviewing(false)}
          onConfirm={() => setPreviewing(false)}
          items={ctl.items.map((it) => ({
            key: it.key,
            src: it.preview,
            ratio: it.ratio,
            caption: "",
            place: "",
            tags: it.tags,
            members: ctl.members,
            album: albumTitle || undefined,
          }))}
        />
      )}
    </div>
  );
}
