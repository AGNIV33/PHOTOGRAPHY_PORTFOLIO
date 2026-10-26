import Link from "next/link";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { PhotoManager } from "@/components/admin/photo-manager";
import { imageUrl } from "@/lib/cloudinary";
import { adminListAlbums, adminListPhotos } from "@/lib/photos";

async function PhotoList() {
  const [photos, albums] = await Promise.all([adminListPhotos(), adminListAlbums()]);
  const albumName = new Map(albums.map((a) => [a.id, a.title]));

  if (photos.length === 0) {
    return (
      <div className="admin-panel grid gap-4 justify-items-start">
        <p className="serif text-[28px]">No photos yet.</p>
        <Link href="/admin/upload" className="btn btn-primary">Add your first photo</Link>
      </div>
    );
  }

  return (
    <PhotoManager
      albums={albums.map((a) => ({ id: a.id, title: a.title }))}
      photos={photos.map((p) => ({
        id: p.id,
        thumb: imageUrl(p.public_id, "thumb"),
        caption: p.caption,
        place: p.place,
        albumId: p.album_id,
        albumName: p.album_id ? albumName.get(p.album_id) ?? "No album" : "No album",
        tags: p.tags ?? [],
        status: p.status,
        visibility: p.visibility,
      }))}
    />
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate>
        <PhotoList />
      </AdminGate>
    </Suspense>
  );
}
