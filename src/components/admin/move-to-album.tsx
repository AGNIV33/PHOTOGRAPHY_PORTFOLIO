"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bulkEditPhotos } from "@/app/admin/actions";
import { Select } from "@/components/select";

// For the photographer, on the Work page: send this photo into an album. A photo that is in
// an album is shown only there, so it leaves the Work page.
export function MoveToAlbum({ photoId, albums }: { photoId: string; albums: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [album, setAlbum] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function move() {
    if (!album) return;
    setBusy(true);
    setError("");
    try {
      await bulkEditPhotos([photoId], { album_id: album });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not move the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="move-album">
      {!open ? (
        <button type="button" className="move-album-open" onClick={() => setOpen(true)}>
          Move to album
        </button>
      ) : (
        <div className="move-album-box">
          <Select
            variant="box"
            ariaLabel="Album to move this photo to"
            value={album}
            onChange={setAlbum}
            placeholder={albums.length ? "Choose an album" : "No albums yet"}
            options={albums.map((a) => ({ value: a.id, label: a.title }))}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || !album} onClick={move}>
              {busy ? "Moving…" : "Move"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
          {error && <span className="text-[13px] text-[var(--safelight)]" role="alert">{error}</span>}
        </div>
      )}
    </div>
  );
}
