import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { UploadForm } from "@/components/admin/upload-form";
import { adminListAlbums } from "@/lib/photos";

async function Upload() {
  const albums = await adminListAlbums();
  return <UploadForm albums={albums.map((a) => ({ id: a.id, title: a.title }))} />;
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
