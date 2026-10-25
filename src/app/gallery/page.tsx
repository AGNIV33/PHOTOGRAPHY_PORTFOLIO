import type { Metadata } from "next";
import { PageHead } from "@/components/page-head";
import { PhotoFrame } from "@/components/photo-frame";
import { frames } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  const open = frames.filter((f) => !f.locked).length;

  return (
    <div className="wrap">
      <PageHead
        index="01"
        title="Gallery"
        intro="Every photograph, newest first. Some are open to everyone; sign in to see the rest."
      />
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
        <span className="label">
          {frames.length} frames · {open} open · {frames.length - open} members only
        </span>
      </div>
      <div className="sheet">
        {frames.map((f) => (
          <PhotoFrame key={f.id} number={f.id} orientation={f.orientation} locked={f.locked} />
        ))}
      </div>
    </div>
  );
}
