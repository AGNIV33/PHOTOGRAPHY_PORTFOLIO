"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { PhotoView } from "@/lib/photos";
import { ProtectedImage } from "./protected-image";

// One photo in a grid. Members-only photos show as a blurred tile until the visitor signs in.
export function PhotoTile({ photo, index }: { photo: PhotoView; index: number }) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <figure className="tile">
      {photo.locked || !photo.thumb ? (
        <div className="frame-media" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
          <div className="frame-locked">
            <span className="lock-title">Members only</span>
            <Link href={`/signin?next=/photo/${photo.id}`} className="lock-cta">
              Sign in to view
            </Link>
          </div>
        </div>
      ) : (
        <Link href={`/photo/${photo.id}`} className="tile-link" aria-label={photo.caption || `Photo ${number}`}>
          <ProtectedImage src={photo.thumb} alt={photo.caption} width={photo.width} height={photo.height} />
        </Link>
      )}
      <figcaption className="frame-meta">
        <span className="frame-caption">{photo.locked ? "" : photo.caption}</span>
        <span className="frame-no">
          {number}
          {!photo.locked && photo.place ? ` · ${photo.place}` : ""}
        </span>
      </figcaption>
    </figure>
  );
}

const WIDE = "(min-width: 1024px)";
const MEDIUM = "(min-width: 640px)";

function subscribe(onChange: () => void) {
  const lists = [window.matchMedia(WIDE), window.matchMedia(MEDIUM)];
  lists.forEach((m) => m.addEventListener("change", onChange));
  return () => lists.forEach((m) => m.removeEventListener("change", onChange));
}

function columnsNow() {
  return window.matchMedia(WIDE).matches ? 3 : window.matchMedia(MEDIUM).matches ? 2 : 1;
}

// Newest photos come first and fill the top row from left to right, then each next photo
// goes into the shortest column. (Plain CSS columns would fill the left column from top to
// bottom first, which makes the order look scrambled.)
export function PhotoGrid({ photos }: { photos: PhotoView[] }) {
  const cols = useSyncExternalStore(subscribe, columnsNow, () => 3);
  const heights = Array<number>(cols).fill(0);
  const columns: { photo: PhotoView; index: number }[][] = Array.from({ length: cols }, () => []);
  photos.forEach((photo, index) => {
    let c = 0;
    for (let k = 1; k < cols; k++) if (heights[k] < heights[c] - 0.001) c = k;
    columns[c].push({ photo, index });
    // The picture's height relative to the column width, plus room for the caption.
    heights[c] += photo.height / Math.max(photo.width, 1) + 0.22;
  });
  return (
    <div className="masonry" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {columns.map((column, i) => (
        <div key={i} className="masonry-col">
          {column.map(({ photo, index }) => (
            <PhotoTile key={photo.id} photo={photo} index={index} />
          ))}
        </div>
      ))}
    </div>
  );
}
