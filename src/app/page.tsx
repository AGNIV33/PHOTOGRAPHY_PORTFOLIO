import Link from "next/link";
import { Hero } from "@/components/hero";
import { PhotoFrame } from "@/components/photo-frame";
import { getHeroImages, HERO_SLOTS } from "@/lib/hero-images";
import { albumSlots, frames } from "@/lib/placeholders";

export default function Home() {
  const selected = frames.slice(0, 6);

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
        <div className="sheet">
          {selected.map((f) => (
            <PhotoFrame key={f.id} number={f.id} orientation={f.orientation} />
          ))}
        </div>
      </section>

      {/* Albums: each series gets a long row */}
      <section className="wrap pt-24 md:pt-32">
        <div className="grid gap-3 border-b border-[var(--hairline)] pb-4">
          <span className="kicker">Series</span>
          <h2 className="display text-[clamp(44px,7vw,96px)]">Albums</h2>
        </div>
        <ol>
          {albumSlots.map((a, i) => (
            <li key={a.id} className="border-b border-[var(--hairline)]">
              <Link
                href="/albums"
                className="group grid grid-cols-[48px_1fr_auto] md:grid-cols-[80px_1fr_220px] items-center gap-4 py-6"
              >
                <span className="frame-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="display text-[clamp(30px,4.5vw,60px)] transition-transform duration-300 group-hover:translate-x-3">
                  {a.title}
                </span>
                <span className="hidden md:block">
                  <PhotoFrame number={`${a.id}1`} orientation="landscape" caption="Cover" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Members-only invitation */}
      <section className="wrap pt-24 md:pt-32">
        <div className="grid gap-6 md:grid-cols-12 items-end">
          <h2 className="md:col-span-7 serif text-[clamp(34px,4.6vw,64px)] leading-[1.08]">
            More of the archive is open to members.
          </h2>
          <div className="md:col-span-5 grid gap-5">
            <p className="text-[var(--ink-2)]">
              Sign in with Google or an email link to see every photograph, and to like and
              comment. No password needed.
            </p>
            <Link href="/signin" className="explore">
              Sign in
              <span className="circle" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 9h13M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
