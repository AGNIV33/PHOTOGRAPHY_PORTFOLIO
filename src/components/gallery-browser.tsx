"use client";

import { useMemo, useState } from "react";
import { countPlaces, countTags, locationOf, sortedCategories } from "@/lib/categories";
import type { PhotoView } from "@/lib/photos";
import { MoveToAlbum } from "./admin/move-to-album";
import { Select } from "./select";
import { PhotoGrid } from "./photo-tile";

// The Work page: filter buttons by category (Black & white, Colour, Street, ...) and a place
// list, then the photographs. The same for visitors and for the photographer.
export function GalleryBrowser({ photos, albums }: { photos: PhotoView[]; albums?: { id: string; title: string }[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [place, setPlace] = useState("");

  const categories = useMemo(() => sortedCategories(countTags(photos)), [photos]);
  const places = useMemo(() => countPlaces(photos), [photos]);

  const shown = useMemo(
    () => photos.filter((p) => (!category || (p.tags ?? []).includes(category)) && (!place || locationOf(p.place) === place)),
    [photos, category, place],
  );

  const filtering = category !== null || place !== "";
  const showBar = categories.length > 0 || places.length > 1;

  return (
    <>
      {showBar && (
        <div className="filters" role="group" aria-label="Filter the photographs">
          <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
            All <small>{photos.length}</small>
          </button>
          {categories.map(([name, count]) => (
            <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => setCategory(category === name ? null : name)}>
              {name} <small>{count}</small>
            </button>
          ))}
          {places.length > 1 && (
            <div className="filter-place">
              <Select
                variant="box"
                ariaLabel="Show photographs from one place"
                value={place}
                onChange={setPlace}
                options={[{ value: "", label: "All places" }, ...places.map(([name, count]) => ({ value: name, label: `${name} (${count})` }))]}
              />
            </div>
          )}
        </div>
      )}

      {filtering && (
        <p className="label filter-count" role="status">
          {shown.length} of {photos.length} photographs
          {category ? ` · ${category}` : ""}
          {place ? ` · ${place}` : ""}
          {" · "}
          <button
            type="button"
            className="text-[var(--safelight)] underline"
            onClick={() => {
              setCategory(null);
              setPlace("");
            }}
          >
            Show all
          </button>
        </p>
      )}

      {shown.length > 0 ? (
        <PhotoGrid photos={shown} extra={albums ? (p) => <MoveToAlbum photoId={p.id} albums={albums} /> : undefined} />
      ) : (
        <p className="serif text-[26px] text-[var(--ink-2)]">No photographs match this filter.</p>
      )}
    </>
  );
}
