import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, PageHead } from "@/components/page-head";
import { PhotoFrame } from "@/components/photo-frame";
import { GalleryBrowser } from "@/components/gallery-browser";
import { getUser, isAdmin } from "@/lib/auth";
import { isBackendReady } from "@/lib/env";
import { adminListAlbums, listPhotos } from "@/lib/photos";
import { frames } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Work" };

function WorkTabs() {
  return (
    <div className="flex gap-6 mb-8 text-[13px] tracking-[0.2em] uppercase">
      <span className="text-[var(--safelight)] border-b border-[var(--safelight)] pb-1">All photos</span>
      <Link href="/albums" className="text-[var(--ink-2)] hover:text-[var(--ink)] pb-1">Albums</Link>
    </div>
  );
}

async function Gallery() {
  if (!isBackendReady) {
    return (
      <div className="sheet">
        {frames.map((f) => (
          <PhotoFrame key={f.id} number={f.id} orientation={f.orientation} locked={f.locked} />
        ))}
      </div>
    );
  }
  const user = await getUser();
  const photos = await listPhotos(user);
  // The photographer gets a "Move to album" button under each photo.
  const albums = isAdmin(user) ? (await adminListAlbums()).map((a) => ({ id: a.id, title: a.title })) : undefined;
  if (photos.length === 0) {
    return <EmptyState title="No photos yet." body="New photographs will appear here soon." />;
  }
  const locked = photos.filter((p) => p.locked).length;
  return (
    <>
      {locked > 0 && (
        <p className="label mb-6">
          {photos.length} photographs · {locked} for members.{" "}
          <Link href="/signin?next=/gallery" className="text-[var(--safelight)] underline">Sign in to see all</Link>
        </p>
      )}
      <GalleryBrowser photos={photos} albums={albums} />
    </>
  );
}

export default function GalleryPage() {
  return (
    <div className="wrap">
      <PageHead index="01" title="Work" intro="Newest first. Photographs that belong to an album are shown in that album." />
      <WorkTabs />
      <Suspense fallback={<p className="label">Loading photographs…</p>}>
        <Gallery />
      </Suspense>
    </div>
  );
}
