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

export function PhotoGrid({ photos }: { photos: PhotoView[] }) {
  return (
    <div className="masonry">
      {photos.map((p, i) => (
        <PhotoTile key={p.id} photo={p} index={i} />
      ))}
    </div>
  );
}
