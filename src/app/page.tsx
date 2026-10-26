import Link from "next/link";
import { Suspense } from "react";
import { GalleryScroller } from "@/components/gallery-scroller";
import { Hero } from "@/components/hero";
import { PhotoGrid } from "@/components/photo-tile";
import { PhotoFrame } from "@/components/photo-frame";
import { ProtectedImage } from "@/components/protected-image";
import { getUser } from "@/lib/auth";
import { isBackendReady } from "@/lib/env";
import { getHeroImages, HERO_SLOTS } from "@/lib/hero-images";
import { getPalette } from "@/lib/palette";
import { listAlbums, listPhotos } from "@/lib/photos";
import { albumSlots, frames } from "@/lib/placeholders";

function PlaceholderSheet() {
  return (
    <div className="sheet">
      {frames.slice(0, 6).map((f) => (
        <PhotoFrame key={f.id} number={f.id} orientation={f.orientation} />
      ))}
    </div>
  );
}

// The newest open photos, so the home page is never a wall of locked tiles.
// Laptops and desktops get the scrolling gallery (the newest 10 photos that are not in an
// album); phones get the plain grid (6 photos).
// Both are in the page and CSS shows one of them; the images are lazy, so the hidden copy is
// never downloaded.
async function RecentFrames() {
  const placeholder = (
    <div className="wrap">
      <PlaceholderSheet />
    </div>
  );
  if (!isBackendReady) return placeholder;
  const user = await getUser();
  const photos = await listPhotos(user, { limit: 24 });
  const open = photos.filter((p) => !p.locked).slice(0, 10);
  if (open.length === 0) return placeholder;
  const palettes = await Promise.all(open.map((p) => getPalette(p.swatch)));
  return (
    <>
      <div className="frames-wide">
        <GalleryScroller photos={open} palettes={palettes} />
      </div>
      <div className="wrap frames-phone">
        <PhotoGrid photos={open.slice(0, 6)} />
      </div>
    </>
  );
}

async function AlbumRows() {
  const user = isBackendReady ? await getUser() : null;
  const albums = isBackendReady ? (await listAlbums(user)).filter((a) => a.count > 0) : [];
  const rows = albums.length
    ? albums.map((a) => ({ key: a.id, href: `/albums/${a.slug}`, title: a.title, cover: a.cover }))
    : albumSlots.map((a) => ({ key: a.id, href: "/albums", title: a.title, cover: null }));
  return (
    <ol>
      {rows.map((a, i) => (
        <li key={a.key} className="border-b border-[var(--hairline)]">
          <Link
            href={a.href}
            className="group grid grid-cols-[48px_1fr_auto] md:grid-cols-[80px_1fr_220px] items-center gap-4 py-6"
          >
            <span className="frame-no">{String(i + 1).padStart(2, "0")}</span>
            <span className="display text-[clamp(30px,4.5vw,60px)] transition-transform duration-300 group-hover:translate-x-3">
              {a.title}
            </span>
            <span className="hidden md:block">
              {a.cover?.thumb ? (
                <ProtectedImage src={a.cover.thumb} alt="" width={a.cover.width} height={a.cover.height} className="album-row-cover" />
              ) : (
                <PhotoFrame number={String(i + 1).padStart(2, "0")} orientation="landscape" caption="Cover" />
              )}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {

  return (
    <>
      <Hero images={getHeroImages()} slots={HERO_SLOTS} />

      {/* Selected work */}
      <section className="wrap pt-24 md:pt-32">
        <div className="flex items-end justify-between border-b border-[var(--hairline)] pb-4 mb-10">
          <div className="grid gap-3">
            <span className="kicker">Selected work</span>
            <h2 className="display text-[clamp(44px,7vw,96px)]">Recent frames</h2>
          </div>
          <Link href="/gallery" className="explore">
            All photos
            <span className="circle" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9h13M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
          </Link>
        </div>
      </section>
      <Suspense
        fallback={
          <div className="wrap">
            <PlaceholderSheet />
          </div>
        }
      >
        <RecentFrames />
      </Suspense>

      {/* Albums: each series gets a long row */}
      <section className="wrap pt-24 md:pt-32">
        <div className="grid gap-3 border-b border-[var(--hairline)] pb-4">
          <span className="kicker">Series</span>
          <h2 className="display text-[clamp(44px,7vw,96px)]">Albums</h2>
        </div>
        <Suspense fallback={null}>
          <AlbumRows />
        </Suspense>
      </section>

      {/* Members-only invitation: a calm band, smaller than the footer's big line below it */}
      <section className="wrap pt-20 md:pt-28 pb-16 md:pb-24">
        <div className="members-band">
          <div className="grid gap-3">
            <span className="kicker">Members</span>
            <h2 className="serif members-title">More of the archive is open to members.</h2>
            <p className="text-[var(--ink-2)] max-w-[52ch]">
              Create a free account to see every photograph, and to like and comment.
            </p>
          </div>
          <Link href="/signup" className="btn btn-primary">
            Create account
          </Link>
        </div>
      </section>
    </>
  );
}
