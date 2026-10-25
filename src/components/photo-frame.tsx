import Link from "next/link";
import type { Orientation } from "@/lib/placeholders";

type Props = {
  number: string;
  orientation: Orientation | "wide";
  locked?: boolean;
  caption?: string;
  place?: string;
  className?: string;
};

// A single photo slot. Until real photos are uploaded it renders an honest empty frame.
export function PhotoFrame({ number, orientation, locked, caption, place, className }: Props) {
  return (
    <figure className={`frame ${className ?? ""}`}>
      <div
        className="frame-media"
        data-o={orientation}
        aria-label={locked ? "Members-only photo" : "Photo placeholder"}
      >
        {locked ? (
          <div className="frame-locked">
            <span className="lock-title">Members only</span>
            <Link href="/signin" className="lock-cta">
              Sign in to view
            </Link>
          </div>
        ) : (
          <div className="frame-empty">
            <span className="label">Photo {number}</span>
          </div>
        )}
      </div>
      <figcaption className="frame-meta">
        <span className="frame-caption">{caption ?? (locked ? "Hidden caption" : "Caption")}</span>
        <span className="frame-no">
          {number}
          {place ? ` · ${place}` : ""}
        </span>
      </figcaption>
    </figure>
  );
}
