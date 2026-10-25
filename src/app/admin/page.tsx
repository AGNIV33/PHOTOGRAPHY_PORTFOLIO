import Link from "next/link";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { DeletePhotoButton } from "@/components/admin/delete-photo-button";
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
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <span className="label">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </span>
        <Link href="/admin/upload" className="btn btn-primary">Add photo</Link>
      </div>
      <ul className="admin-grid">
        {photos.map((p) => (
          <li key={p.id} className="admin-card">
            <Link href={`/admin/photos/${p.id}`} className="admin-card-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(p.public_id, "thumb")} alt={p.caption} loading="lazy" />
              <span className="badges">
                {p.status === "draft" && <span className="badge">Draft</span>}
                {p.visibility === "members" && <span className="badge">Members</span>}
              </span>
            </Link>
            <div className="grid gap-1">
              <span className="truncate">{p.caption || "No caption"}</span>
              <span className="text-[13px] text-[var(--muted)] truncate">
                {p.album_id ? albumName.get(p.album_id) ?? "No album" : "No album"}
                {p.place ? ` · ${p.place}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Link href={`/admin/photos/${p.id}`} className="text-[14px] underline">Edit</Link>
              <DeletePhotoButton id={p.id} label={p.caption || "photo"} />
            </div>
          </li>
        ))}
      </ul>
    </div>
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
