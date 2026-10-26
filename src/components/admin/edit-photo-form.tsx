"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAlbum, deletePhoto, suggestTags, updatePhoto, type PhotoInput } from "@/app/admin/actions";
import { PhotoFields, type AlbumOption } from "./photo-fields";

type Props = {
  id: string;
  initial: PhotoInput;
  albums: AlbumOption[];
  knownTags: string[];
};

export function EditPhotoForm({ id, initial, albums: initialAlbums, knownTags }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [albums, setAlbums] = useState(initialAlbums);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [suggesting, setSuggesting] = useState(false);
  const [tagsNote, setTagsNote] = useState("");

  async function suggest() {
    setSuggesting(true);
    setTagsNote("");
    try {
      const r = await suggestTags(id);
      setValue((v) => ({ ...v, tags: r.tags }));
      setSaved(false);
      setTagsNote(
        r.ai
          ? "Suggested by AI. Take off any that don't fit, then save."
          : r.aiError
            ? `Black & white / colour was checked, but the AI step failed: ${r.aiError}`
            : "Black & white / colour was checked. AI style suggestions need the AI key (NVIDIA_API_KEY) to be set up.",
      );
    } catch (e) {
      setTagsNote(e instanceof Error ? e.message : "Could not suggest categories.");
    } finally {
      setSuggesting(false);
    }
  }

  const save = (status: PhotoInput["status"]) =>
    start(async () => {
      setError("");
      try {
        await updatePhoto(id, { ...value, status });
        setValue((v) => ({ ...v, status }));
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });

  const remove = () => {
    if (!window.confirm("Delete this photo? It will be removed from the website for good.")) return;
    start(async () => {
      try {
        await deletePhoto(id);
        router.push("/admin");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete");
      }
    });
  };

  return (
    <div className="grid gap-6">
      <PhotoFields
        idPrefix="edit"
        value={value}
        albums={albums}
        knownTags={knownTags}
        onSuggestTags={suggest}
        suggestingTags={suggesting}
        tagsNote={tagsNote}
        onChange={(v) => {
          setValue(v);
          setSaved(false);
        }}
        onNewAlbum={async () => {
          const title = window.prompt("Name of the new album");
          if (!title?.trim()) return;
          const albumId = await createAlbum(title, "");
          setAlbums((a) => [...a, { id: albumId, title: title.trim() }]);
          setValue((v) => ({ ...v, album_id: albumId }));
        }}
      />

      <div className="publish-bar">
        <span className="text-[var(--ink-2)]" role="status">
          {error ? (
            <span className="text-[var(--safelight)]">{error}</span>
          ) : saved ? (
            "Saved."
          ) : value.status === "draft" ? (
            "This photo is a draft. Only you can see it."
          ) : (
            "This photo is live on the website."
          )}
        </span>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-danger" disabled={pending} onClick={remove}>
            Delete photo
          </button>
          {value.status === "published" ? (
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => save("draft")}>
              Hide (make draft)
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => save("published")}>
            {pending ? "Saving…" : value.status === "draft" ? "Publish" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
