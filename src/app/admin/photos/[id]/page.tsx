import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { EditPhotoForm } from "@/components/admin/edit-photo-form";
import { imageUrl } from "@/lib/cloudinary";
import { countTags } from "@/lib/categories";
import { adminGetPhoto, adminListAlbums, adminListPhotos } from "@/lib/photos";

async function Editor({ params }: { params: PageProps<"/admin/photos/[id]">["params"] }) {
  const { id } = await params;
  const [photo, albums, all] = await Promise.all([adminGetPhoto(id), adminListAlbums(), adminListPhotos()]);
  if (!photo) notFound();

  const input = {
    caption: photo.caption,
    place: photo.place,
    taken_at: photo.taken_at,
    camera: photo.camera,
    lens: photo.lens,
    focal_length: photo.focal_length,
    aperture: photo.aperture,
    shutter: photo.shutter,
    iso: photo.iso,
    album_id: photo.album_id,
    visibility: photo.visibility,
    status: photo.status,
    tags: photo.tags ?? [],
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-5 grid gap-3 content-start">
        <Link href="/admin" className="text-[14px] text-[var(--ink-2)] underline">← All photos</Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(photo.public_id, "large")} alt={photo.caption} className="w-full bg-[var(--paper-2)]" />
        {photo.status === "published" && (
          <Link href={`/photo/${photo.id}`} className="text-[14px] underline">See it on the website →</Link>
        )}
      </div>
      <div className="lg:col-span-7">
        <EditPhotoForm
          id={photo.id}
          initial={input}
          albums={albums.map((a) => ({ id: a.id, title: a.title }))}
          knownTags={[...countTags(all).keys()]}
        />
      </div>
    </div>
  );
}

export default function EditPhotoPage(props: PageProps<"/admin/photos/[id]">) {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate>
        <Editor params={props.params} />
      </AdminGate>
    </Suspense>
  );
}
