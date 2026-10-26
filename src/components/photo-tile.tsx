"use client";

import Link from "next/link";
import type { PhotoView } from "@/lib/photos";
import { ProtectedImage } from "./protected-image";

// One photo in a grid. Members-only photos show as a blurred tile until the visitor signs in.
export function PhotoTile({ photo, index, extra }: { photo: PhotoView; index: number; extra?: React.ReactNode }) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <figure className="tile" style={{ "--r": photo.width / Math.max(photo.height, 1) } as React.CSSProperties}>
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
      {extra}
    </figure>
  );
}

// Newest photos first, left to right. Every photo keeps its own shape; the photos in one row
// are scaled to the same height, so the tops, bottoms and captions line up (see .justified).
export function PhotoGrid({ photos, extra }: { photos: PhotoView[]; extra?: (photo: PhotoView) => React.ReactNode }) {
  return (
    <div className="justified">
      {photos.map((photo, index) => (
        <PhotoTile key={photo.id} photo={photo} index={index} extra={extra?.(photo)} />
      ))}
    </div>
  );
}
