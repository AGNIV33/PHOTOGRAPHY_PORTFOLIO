import Link from "next/link";
import { PhotoFrame } from "@/components/photo-frame";
import { site } from "@/config/site";
import { albumSlots, frames } from "@/lib/placeholders";

export default function Home() {
  const selected = frames.slice(0, 6);

  return (
    <>
      {/* Hero: one featured photograph, edge to edge, with the name set over the film edge */}
      <section className="wrap pt-6 md:pt-10">
        <div className="develop">
          <PhotoFrame number="00" orientation="wide" caption="Featured photograph" />
        </div>
        <div className="grid gap-6 pt-10 md:grid-cols-12 md:pt-16">
          <h1 className="md:col-span-8 text-[clamp(56px,11vw,168px)] [font-stretch:118%]">
            {site.name}
          </h1>
          <div className="md:col-span-4 grid content-end gap-4">
            <span className="label">
              {site.role} · {site.city}
            </span>
            <p className="text-[19px] text-[var(--ink-2)]">{site.intro}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/gallery" className="btn btn-primary">
                See the gallery
              </Link>
              <Link href="/albums" className="btn btn-ghost">
                Albums
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Selected work, laid out like a contact sheet */}
      <section className="wrap pt-24">
        <div className="flex items-baseline justify-between border-b border-[var(--hairline)] pb-3 mb-8">
          <h2 className="text-[clamp(28px,4vw,44px)]">Selected work</h2>
          <Link href="/gallery" className="arrow-link text-[15px]">
            All photos →
          </Link>
        </div>
        <div className="sheet">
          {selected.map((f) => (
            <PhotoFrame key={f.id} number={f.id} orientation={f.orientation} />
          ))}
        </div>
      </section>

      {/* Albums: each series gets a long row, cover left, story right */}
      <section className="wrap pt-24">
        <div className="flex items-baseline justify-between border-b border-[var(--hairline)] pb-3 mb-2">
          <h2 className="text-[clamp(28px,4vw,44px)]">Albums</h2>
          <Link href="/albums" className="arrow-link text-[15px]">
            All albums →
          </Link>
        </div>
        <ol>
          {albumSlots.map((a, i) => (
            <li key={a.id} className="border-b border-[var(--hairline)]">
              <Link
                href="/albums"
                className="group grid grid-cols-[48px_1fr_auto] md:grid-cols-[80px_1fr_220px] items-center gap-4 py-5"
              >
                <span className="frame-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[clamp(22px,3.2vw,40px)] font-semibold tracking-tight transition-transform duration-200 group-hover:translate-x-2">
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
      <section className="wrap pt-24">
        <div className="grid gap-6 md:grid-cols-12 items-end border-t-2 border-[var(--ink)] pt-6">
          <h2 className="md:col-span-7 text-[clamp(32px,5vw,64px)]">
            More of the archive is open to members.
          </h2>
          <div className="md:col-span-5 grid gap-4">
            <p className="text-[var(--ink-2)]">
              Sign in with Google or an email link to see every photo, and to like and comment.
              No password needed.
            </p>
            <div>
              <Link href="/signin" className="btn btn-primary">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
