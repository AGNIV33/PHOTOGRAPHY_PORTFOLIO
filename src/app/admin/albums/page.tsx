import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { AlbumsManager } from "@/components/admin/albums-manager";
import { imageUrl } from "@/lib/cloudinary";
import { adminListAlbums, adminListPhotos, inAlbumOrder } from "@/lib/photos";

async function Albums() {
  const [albums, photos] = await Promise.all([adminListAlbums(), adminListPhotos()]);
  const data = albums.map((a) => ({
    id: a.id,
    title: a.title,
    story: a.story,
    slug: a.slug,
    cover_photo_id: a.cover_photo_id,
    photos: inAlbumOrder(photos.filter((p) => p.album_id === a.id)).map((p) => ({
      id: p.id,
      caption: p.caption,
      status: p.status,
      thumb: imageUrl(p.public_id, "thumb"),
    })),
  }));
  return <AlbumsManager albums={data} />;
}

export default function AlbumsAdminPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/albums">
        <Albums />
      </AdminGate>
    </Suspense>
  );
}
