import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { UploadForm } from "@/components/admin/upload-form";
import { countTags } from "@/lib/categories";
import { adminListAlbums, adminListPhotos } from "@/lib/photos";

async function Upload() {
  const [albums, photos] = await Promise.all([adminListAlbums(), adminListPhotos()]);
  return <UploadForm albums={albums.map((a) => ({ id: a.id, title: a.title }))} knownTags={[...countTags(photos).keys()]} />;
}

export default function UploadPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/upload">
        <Upload />
      </AdminGate>
    </Suspense>
  );
}
