"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { bulkDeletePhotos, bulkEditPhotos, type BulkPatch } from "@/app/admin/actions";
import { BW, COLOUR, STYLE_TAGS, canonicalTag, countPlaces, countTags, locationOf, sortedCategories } from "@/lib/categories";
import { Select, SuggestInput } from "@/components/select";
import { DeletePhotoButton } from "./delete-photo-button";

export type ManagedPhoto = {
  id: string;
  thumb: string;
  caption: string;
  place: string;
  albumId: string | null;
  albumName: string;
  tags: string[];
  status: "draft" | "published";
  visibility: "public" | "members";
};

type Panel = "add" | "remove" | "album" | "see" | null;

// "My photos": filter by category or place, and change many photos at once —
// categories, album, who can see them, hide or delete.
export function PhotoManager({ photos, albums }: { photos: ManagedPhoto[]; albums: { id: string; title: string }[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  // "" = every album, "none" = photos that are not in an album, otherwise one album's id
  const [albumFilter, setAlbumFilter] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel>(null);
  const [newTag, setNewTag] = useState("");
  const [albumChoice, setAlbumChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const categories = useMemo(() => sortedCategories(countTags(photos)), [photos]);
  const places = useMemo(() => countPlaces(photos), [photos]);
  const shown = useMemo(
    () =>
      photos.filter(
        (p) =>
          (!category || p.tags.includes(category)) &&
          (!place || locationOf(p.place) === place) &&
          (!albumFilter || (albumFilter === "none" ? !p.albumId : p.albumId === albumFilter)),
      ),
    [photos, category, place, albumFilter],
  );

  const ids = [...picked].filter((id) => photos.some((p) => p.id === id));
  const pickedPhotos = photos.filter((p) => picked.has(p.id));
  const tagsOnPicked = [...new Set(pickedPhotos.flatMap((p) => p.tags))];
  const allShownPicked = shown.length > 0 && shown.every((p) => picked.has(p.id));
  const suggestions = [...new Set([BW, COLOUR, ...categories.map(([n]) => n), ...STYLE_TAGS])];

  function toggle(id: string) {
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stop() {
    setSelecting(false);
    setPicked(new Set());
    setPanel(null);
  }

  async function apply(patch: BulkPatch, done: string) {
    setBusy(true);
    setMsg("");
    try {
      await bulkEditPhotos(ids, patch);
      setMsg(done);
      setPanel(null);
      setNewTag("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAll() {
    if (!window.confirm(`Delete ${ids.length} photo${ids.length === 1 ? "" : "s"}? They will be removed from the website for good.`)) return;
    setBusy(true);
    try {
      await bulkDeletePhotos(ids);
      stop();
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  const addTag = (raw: string) => {
    const tag = canonicalTag(raw);
    if (tag) void apply({ addTags: [tag] }, `Added “${tag}” to ${ids.length} photo${ids.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label">
          {shown.length === photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : `${shown.length} of ${photos.length} photos`}
        </span>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/categories" className="btn btn-ghost">Categories</Link>
          <button type="button" className="btn btn-ghost" aria-pressed={selecting} onClick={() => (selecting ? stop() : setSelecting(true))}>
            {selecting ? "Done selecting" : "Select photos"}
          </button>
          <Link href="/admin/upload" className="btn btn-primary">Add photo</Link>
        </div>
      </div>

      {(categories.length > 0 || places.length > 1 || albums.length > 0) && (
        <div className="filters" role="group" aria-label="Filter your photos" style={{ marginBottom: 0 }}>
          <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
            All <small>{photos.length}</small>
          </button>
          {categories.map(([name, count]) => (
            <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => setCategory(category === name ? null : name)}>
              {name} <small>{count}</small>
            </button>
          ))}
          {albums.length > 0 && (
            <div className="filter-place" style={{ marginLeft: 0 }}>
              <Select
                variant="box"
                ariaLabel="Show photos from one album"
                value={albumFilter}
                onChange={setAlbumFilter}
                options={[
                  { value: "", label: "All albums" },
                  { value: "none", label: "Not in an album" },
                  ...albums.map((a) => ({ value: a.id, label: a.title })),
                ]}
              />
            </div>
          )}
          {places.length > 1 && (
            <div className="filter-place">
              <Select
                variant="box"
                ariaLabel="Show photos from one place"
                value={place}
                onChange={setPlace}
                options={[{ value: "", label: "All places" }, ...places.map(([name, count]) => ({ value: name, label: `${name} (${count})` }))]}
              />
            </div>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-[var(--ink-2)]">No photos match this filter.</p>
      ) : (
        <ul className="admin-grid">
          {shown.map((p) => (
            <li key={p.id} className="admin-card" data-picked={picked.has(p.id) ? "" : undefined}>
              {selecting ? (
                <div className="admin-card-media" onClick={() => toggle(p.id)} style={{ cursor: "pointer" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb} alt={p.caption} loading="lazy" />
                  <button
                    type="button"
                    className="org-pick"
                    aria-pressed={picked.has(p.id)}
                    aria-label={`${picked.has(p.id) ? "Unselect" : "Select"} ${p.caption || "photo"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(p.id);
                    }}
                  >
                    {picked.has(p.id) ? "✓" : ""}
                  </button>
                </div>
              ) : (
                <Link href={`/admin/photos/${p.id}`} className="admin-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb} alt={p.caption} loading="lazy" />
                  <span className="badges">
                    {p.status === "draft" && <span className="badge">Draft</span>}
                    {p.visibility === "members" && <span className="badge">Members</span>}
                  </span>
                </Link>
              )}
              <div className="grid gap-1">
                <span className="truncate">{p.caption || "No caption"}</span>
                <span className="text-[13px] text-[var(--muted)] truncate">
                  {p.albumName}
                  {p.place ? ` · ${p.place}` : ""}
                </span>
                <span className="admin-card-tags">{p.tags.length ? p.tags.join(" · ") : "No categories yet"}</span>
              </div>
              {!selecting && (
                <div className="flex items-center justify-between">
                  <Link href={`/admin/photos/${p.id}`} className="text-[14px] underline">Edit</Link>
                  <DeletePhotoButton id={p.id} label={p.caption || "photo"} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {selecting && (
        <div className="org-bar" role="region" aria-label="Change the selected photos">
          <div className="org-row">
            <strong>{ids.length} selected</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked(allShownPicked ? new Set() : new Set(shown.map((p) => p.id)))}>
              {allShownPicked ? "Unselect all" : `Select all ${shown.length} shown`}
            </button>
            {msg && <span className="text-[14px] text-[var(--ink-2)]" role="status">{msg}</span>}
          </div>
          {ids.length === 0 ? (
            <p className="text-[14px] text-[var(--ink-2)]">Tap the photos you want to change. Then add them to a category, move them to an album, or change who can see them.</p>
          ) : (
            <>
              <div className="org-row">
                <button type="button" className="btn btn-ghost btn-sm" aria-pressed={panel === "add"} onClick={() => setPanel(panel === "add" ? null : "add")}>
                  Add to category
                </button>
                <button type="button" className="btn btn-ghost btn-sm" aria-pressed={panel === "remove"} onClick={() => setPanel(panel === "remove" ? null : "remove")} disabled={tagsOnPicked.length === 0}>
                  Take off category
                </button>
                <button type="button" className="btn btn-ghost btn-sm" aria-pressed={panel === "album"} onClick={() => setPanel(panel === "album" ? null : "album")}>
                  Move to album
                </button>
                <button type="button" className="btn btn-ghost btn-sm" aria-pressed={panel === "see"} onClick={() => setPanel(panel === "see" ? null : "see")}>
                  Who can see
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => apply({ status: "published" }, "Published.")}>
                  Publish
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => apply({ status: "draft" }, "Hidden (now drafts).")}>
                  Hide
                </button>
                <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={removeAll}>
                  Delete
                </button>
              </div>

              {panel === "add" && (
                <div className="grid gap-2">
                  <div className="tag-quick">
                    {suggestions.slice(0, 14).map((t) => (
                      <button key={t} type="button" disabled={busy} onClick={() => addTag(t)}>
                        + {t}
                      </button>
                    ))}
                  </div>
                  <div className="org-row">
                    <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
                      <SuggestInput
                        value={newTag}
                        onChange={setNewTag}
                        onPick={addTag}
                        suggestions={suggestions}
                        maxLength={30}
                        placeholder="Or type a new category"
                        aria-label="New category"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(newTag);
                          }
                        }}
                      />
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" disabled={busy || !newTag.trim()} onClick={() => addTag(newTag)}>
                      Add
                    </button>
                  </div>
                </div>
              )}

              {panel === "remove" && (
                <div className="tag-quick">
                  {tagsOnPicked.map((t) => (
                    <button key={t} type="button" disabled={busy} onClick={() => apply({ removeTags: [t] }, `Took “${t}” off the selected photos.`)}>
                      − {t}
                    </button>
                  ))}
                </div>
              )}

              {panel === "album" && (
                <div className="org-row">
                  <div style={{ flex: "1 1 240px", maxWidth: 360 }}>
                    <Select
                      variant="box"
                      ariaLabel="Album to move the photos to"
                      value={albumChoice}
                      onChange={setAlbumChoice}
                      placeholder="Choose an album"
                      options={[{ value: "none", label: "No album (take out of its album)" }, ...albums.map((a) => ({ value: a.id, label: a.title }))]}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy || !albumChoice}
                    onClick={() => apply({ album_id: albumChoice === "none" ? null : albumChoice }, "Moved.")}
                  >
                    Move
                  </button>
                </div>
              )}

              {panel === "see" && (
                <div className="org-row">
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => apply({ visibility: "public" }, "Now visible to everyone.")}>
                    Everyone
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => apply({ visibility: "members" }, "Now for members only.")}>
                    Members only
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
