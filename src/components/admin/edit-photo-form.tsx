"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAlbum, deletePhoto, updatePhoto, type PhotoInput } from "@/app/admin/actions";
import { PhotoFields, type AlbumOption } from "./photo-fields";

type Props = {
  id: string;
  initial: PhotoInput;
  albums: AlbumOption[];
};

export function EditPhotoForm({ id, initial, albums: initialAlbums }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [albums, setAlbums] = useState(initialAlbums);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

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
