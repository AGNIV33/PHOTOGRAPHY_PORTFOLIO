import type { Metadata } from "next";
import { PageHead } from "@/components/page-head";
import { PhotoFrame } from "@/components/photo-frame";
import { albumSlots } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Albums" };

export default function AlbumsPage() {
  return (
    <div className="wrap">
      <PageHead
        index="02"
        title="Albums"
        intro="Long-running series on one subject, each with its own story."
      />
      <div className="grid gap-16">
        {albumSlots.map((a, i) => (
          <article key={a.id} className="grid gap-6 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <PhotoFrame number={`${a.id}1`} orientation="landscape" caption="Album cover" />
            </div>
            <div className="md:col-span-5 grid gap-3 md:pt-2">
              <span className="frame-no">Series {String(i + 1).padStart(2, "0")}</span>
              <h2 className="text-[clamp(30px,4vw,52px)]">{a.title}</h2>
              <p className="text-[var(--ink-2)]">
                The album story goes here. It is written in the admin dashboard.
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
