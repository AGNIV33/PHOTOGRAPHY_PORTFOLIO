"use client";

import type { PhotoInput } from "@/app/admin/actions";

export type AlbumOption = { id: string; title: string };

type Props = {
  value: PhotoInput;
  onChange: (v: PhotoInput) => void;
  albums: AlbumOption[];
  onNewAlbum?: () => void;
  idPrefix: string;
};

// The plain form your father fills in for each photo.
export function PhotoFields({ value, onChange, albums, onNewAlbum, idPrefix }: Props) {
  const set = <K extends keyof PhotoInput>(k: K, v: PhotoInput[K]) => onChange({ ...value, [k]: v });
  const id = (k: string) => `${idPrefix}-${k}`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5" htmlFor={id("caption")}>
          <span className="label">Caption</span>
          <input
            id={id("caption")}
            className="field"
            value={value.caption}
            onChange={(e) => set("caption", e.target.value)}
            placeholder="Tram at Esplanade, dusk"
          />
        </label>
        <label className="grid gap-1.5" htmlFor={id("place")}>
          <span className="label">Place</span>
          <input
            id={id("place")}
            className="field"
            value={value.place}
            onChange={(e) => set("place", e.target.value)}
            placeholder="Esplanade, Kolkata"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5" htmlFor={id("album")}>
          <span className="label">Album</span>
          <div className="flex gap-2">
            <select
              id={id("album")}
              className="field flex-1"
              value={value.album_id ?? ""}
              onChange={(e) => set("album_id", e.target.value || null)}
            >
              <option value="">No album</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            {onNewAlbum && (
              <button type="button" className="btn btn-ghost" onClick={onNewAlbum}>
                New album
              </button>
            )}
          </div>
        </label>

        <fieldset className="grid gap-1.5">
          <legend className="label mb-1.5">Who can see it</legend>
          <div className="choice-row">
            <label className="choice">
              <input
                type="radio"
                name={id("vis")}
                checked={value.visibility === "public"}
                onChange={() => set("visibility", "public")}
              />
              <span>Everyone</span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name={id("vis")}
                checked={value.visibility === "members"}
                onChange={() => set("visibility", "members")}
              />
              <span>Members only</span>
            </label>
          </div>
        </fieldset>
      </div>

      <details className="exif-details">
        <summary>
          <span className="label">Camera details</span>
          <span className="exif-summary">
            {[value.camera, value.focal_length, value.aperture, value.shutter, value.iso && `ISO ${value.iso}`, value.taken_at]
              .filter(Boolean)
              .join(" · ") || "None found. Tap to add."}
          </span>
        </summary>
        <div className="grid gap-3 pt-3 grid-cols-2 md:grid-cols-4">
          {(
            [
              ["taken_at", "Date", "date"],
              ["camera", "Camera", "text"],
              ["lens", "Lens", "text"],
              ["focal_length", "Focal length", "text"],
              ["aperture", "Aperture", "text"],
              ["shutter", "Shutter", "text"],
              ["iso", "ISO", "text"],
            ] as const
          ).map(([k, label, type]) => (
            <label key={k} className="grid gap-1.5" htmlFor={id(k)}>
              <span className="label">{label}</span>
              <input
                id={id(k)}
                type={type}
                className="field"
                value={(value[k] as string | null) ?? ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
