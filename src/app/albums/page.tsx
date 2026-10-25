import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, PageHead } from "@/components/page-head";
import { PhotoFrame } from "@/components/photo-frame";
import { ProtectedImage } from "@/components/protected-image";
import { getUser } from "@/lib/auth";
import { isBackendReady } from "@/lib/env";
import { listAlbums } from "@/lib/photos";
import { albumSlots } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Albums" };

async function AlbumList() {
  if (!isBackendReady) {
    return (
      <div className="grid gap-16">
        {albumSlots.map((a) => (
          <PhotoFrame key={a.id} number={`${a.id}1`} orientation="wide" caption={a.title} />
        ))}
      </div>
    );
  }
  const user = await getUser();
  const albums = (await listAlbums(user)).filter((a) => a.count > 0);
  if (albums.length === 0) return <EmptyState title="No albums yet." body="Series of photographs will appear here." />;

  return (
    <div className="grid gap-20">
      {albums.map((a, i) => (
        <article key={a.id} className="grid gap-6 md:grid-cols-12 items-center">
          <Link href={`/albums/${a.slug}`} className="md:col-span-7 block album-cover">
            {a.cover?.thumb ? (
              <ProtectedImage src={a.cover.thumb} alt={a.title} width={a.cover.width} height={a.cover.height} />
            ) : (
              <PhotoFrame number={String(i + 1).padStart(2, "0")} orientation="landscape" locked />
            )}
          </Link>
          <div className="md:col-span-5 grid gap-4">
            <span className="frame-no">
              Series {String(i + 1).padStart(2, "0")} · {a.count} photograph{a.count === 1 ? "" : "s"}
            </span>
            <h2 className="display text-[clamp(40px,5vw,72px)]">
              <Link href={`/albums/${a.slug}`}>{a.title}</Link>
            </h2>
            {a.story && <p className="serif text-[20px] text-[var(--ink-2)] line-clamp-4">{a.story}</p>}
            <Link href={`/albums/${a.slug}`} className="explore">
              Open album
              <span className="circle" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 9h13M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AlbumsPage() {
  return (
    <div className="wrap">
      <PageHead index="02" title="Albums" intro="Long-running series on one subject, each with its own story." />
      <div className="flex gap-6 mb-10 text-[13px] tracking-[0.2em] uppercase">
        <Link href="/gallery" className="text-[var(--ink-2)] hover:text-[var(--ink)] pb-1">All photos</Link>
        <span className="text-[var(--safelight)] border-b border-[var(--safelight)] pb-1">Albums</span>
      </div>
      <Suspense fallback={<p className="label">Loading albums…</p>}>
        <AlbumList />
      </Suspense>
    </div>
  );
}
