"use client";

// Shows a photo with saving made hard: no right-click menu, no drag, no long-press save.
// A transparent layer sits on top, so "Save image" targets nothing.
export function ProtectedImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`protected ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <span className="shield" aria-hidden="true" />
    </span>
  );
}
