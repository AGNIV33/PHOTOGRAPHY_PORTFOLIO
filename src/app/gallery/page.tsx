import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, PageHead } from "@/components/page-head";
import { PhotoFrame } from "@/components/photo-frame";
import { PhotoGrid } from "@/components/photo-tile";
import { getUser } from "@/lib/auth";
import { isBackendReady } from "@/lib/env";
import { listPhotos } from "@/lib/photos";
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
      <PhotoGrid photos={photos} />
    </>
  );
}

export default function GalleryPage() {
  return (
    <div className="wrap">
      <PageHead index="01" title="Work" intro="Every photograph, newest first." />
      <WorkTabs />
      <Suspense fallback={<p className="label">Loading photographs…</p>}>
        <Gallery />
      </Suspense>
    </div>
  );
}
