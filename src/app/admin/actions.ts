"use server";

import { requireAdmin } from "@/lib/auth";
import { BW, COLOUR, canonicalTag, cleanTags, withColourTag } from "@/lib/categories";
import { aiAvailable, analyzePhoto, mergeTags } from "@/lib/classify";
import { deleteImage, signUpload } from "@/lib/cloudinary";
import { adminGetPhoto, adminListPhotos, type PhotoRow, type Visibility } from "@/lib/photos";
import { slugify, uniqueSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/server";

export type PhotoInput = {
  caption: string;
  place: string;
  taken_at: string | null;
  camera: string;
  lens: string;
  focal_length: string;
  aperture: string;
  shutter: string;
  iso: string;
  album_id: string | null;
  visibility: Visibility;
  status: "draft" | "published";
  tags: string[];
};

function clean(input: PhotoInput): PhotoInput {
  const t = (s: string) => (s ?? "").trim().slice(0, 300);
  return {
    caption: t(input.caption),
    place: t(input.place),
    taken_at: input.taken_at || null,
    camera: t(input.camera),
    lens: t(input.lens),
    focal_length: t(input.focal_length),
    aperture: t(input.aperture),
    shutter: t(input.shutter),
    iso: t(input.iso),
    album_id: input.album_id || null,
    visibility: input.visibility === "members" ? "members" : "public",
    status: input.status === "draft" ? "draft" : "published",
    tags: cleanTags(input.tags),
  };
}

// ---------- Photos ----------

export async function getUploadSignature() {
  await requireAdmin();
  return signUpload();
}

// Saves an uploaded photo. Unless told not to, it also works out the photo's categories:
// black & white or colour from the picture, and style categories with AI when a key is set.
export async function createPhoto(
  upload: { public_id: string; width: number; height: number },
  input: PhotoInput,
  opts: { analyze?: boolean } = {},
) {
  await requireAdmin();
  const base = clean(input);
  if (opts.analyze !== false) {
    try {
      base.tags = mergeTags(base.tags, await analyzePhoto(upload.public_id));
    } catch {}
  }
  const { data, error } = await createAdminClient()
    .from("photos")
    .insert({ ...base, ...upload })
    .select("id")
    .single();
  if (error) {
    // Don't leave an orphan file in Cloudinary if the record could not be saved.
    await deleteImage(upload.public_id).catch(() => {});
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function updatePhoto(id: string, input: PhotoInput) {
  await requireAdmin();
  const { error } = await createAdminClient().from("photos").update(clean(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePhoto(id: string) {
  await requireAdmin();
  const photo = await adminGetPhoto(id);
  if (!photo) return;
  await deleteImage(photo.public_id);
  const { error } = await createAdminClient().from("photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- Albums ----------

export async function createAlbum(title: string, story: string) {
  await requireAdmin();
  const name = title.trim();
  if (!name) throw new Error("Please give the album a name.");
  const db = createAdminClient();
  const base = slugify(name, "album");
  // Make the web address unique: kolkata-trams, kolkata-trams-2, ...
  const { data: taken } = await db.from("albums").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => r.slug));
  const slug = uniqueSlug(base, used);
  const { count } = await db.from("albums").select("*", { count: "exact", head: true });
  const { data, error } = await db
    .from("albums")
    .insert({ title: name, story: story.trim(), slug, position: count ?? 0 })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateAlbum(id: string, fields: { title: string; story: string }) {
  await requireAdmin();
  if (!fields.title.trim()) throw new Error("Please give the album a name.");
  const { error } = await createAdminClient()
    .from("albums")
    .update({ title: fields.title.trim(), story: fields.story.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setAlbumCover(albumId: string, photoId: string | null) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("albums")
    .update({ cover_photo_id: photoId })
    .eq("id", albumId);
  if (error) throw new Error(error.message);
}

export async function moveAlbum(id: string, direction: -1 | 1) {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from("albums").select("id").order("position").order("created_at");
  const ids = (data ?? []).map((r) => r.id as string);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((albumId, position) => db.from("albums").update({ position }).eq("id", albumId)));
}

// Photos in a deleted album are kept; they just no longer belong to an album.
// A cover picture uploaded only for the album (a hidden draft) goes with it.
export async function deleteAlbum(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data: album } = await db.from("albums").select("cover_photo_id").eq("id", id).maybeSingle();
  const cover = album?.cover_photo_id ? await adminGetPhoto(album.cover_photo_id as string) : null;
  const { error } = await db.from("albums").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (cover && cover.status === "draft" && cover.album_id === id) await deletePhoto(cover.id);
}

// ---------- Categories ----------

export async function getAiStatus() {
  await requireAdmin();
  return { ai: aiAvailable };
}

// Suggests categories for one photo without saving them (the edit page shows them first).
export async function suggestTags(id: string) {
  await requireAdmin();
  const photo = await adminGetPhoto(id);
  if (!photo) throw new Error("Photo not found.");
  const found = await analyzePhoto(photo.public_id);
  return { tags: mergeTags(photo.tags ?? [], found), ai: found.aiUsed, aiError: found.aiError };
}

// For "categorise everything": which photos still need categories.
export async function photosNeedingCategories(all: boolean) {
  await requireAdmin();
  const photos = await adminListPhotos();
  const needs = (p: PhotoRow) => {
    const tags = p.tags ?? [];
    const hasColour = tags.includes(BW) || tags.includes(COLOUR);
    const hasStyle = tags.some((t) => t !== BW && t !== COLOUR);
    return all || !hasColour || (aiAvailable && !hasStyle);
  };
  return photos.filter(needs).map((p) => p.id);
}

// Works out and saves the categories of one photo, keeping whatever was set by hand.
export async function categorizePhoto(id: string) {
  await requireAdmin();
  const photo = await adminGetPhoto(id);
  if (!photo) throw new Error("Photo not found.");
  const found = await analyzePhoto(photo.public_id);
  const tags = mergeTags(photo.tags ?? [], found);
  const { error } = await createAdminClient().from("photos").update({ tags }).eq("id", id);
  if (error) throw new Error(error.message);
  return { tags, ai: found.aiUsed, aiError: found.aiError };
}

export type BulkPatch = {
  addTags?: string[];
  removeTags?: string[];
  // undefined = leave as it is, null = take out of any album
  album_id?: string | null;
  visibility?: Visibility;
  status?: "draft" | "published";
};

// One change applied to many photos at once.
export async function bulkEditPhotos(ids: string[], patch: BulkPatch) {
  await requireAdmin();
  const list = [...new Set(ids)].slice(0, 500);
  if (list.length === 0) return 0;
  const db = createAdminClient();
  const { data, error } = await db.from("photos").select("id, tags").in("id", list);
  if (error) throw new Error(error.message);
  const add = cleanTags(patch.addTags);
  const remove = new Set((patch.removeTags ?? []).map((t) => canonicalTag(t)));
  const fields: Record<string, unknown> = {};
  if (patch.album_id !== undefined) fields.album_id = patch.album_id || null;
  if (patch.visibility) fields.visibility = patch.visibility === "members" ? "members" : "public";
  if (patch.status) fields.status = patch.status === "draft" ? "draft" : "published";
  const touchesTags = add.length > 0 || remove.size > 0;
  await Promise.all(
    (data ?? []).map(async (row) => {
      const update: Record<string, unknown> = { ...fields };
      if (touchesTags) {
        let tags = cleanTags(((row.tags as string[] | null) ?? []).filter((t) => !remove.has(t)));
        const colour = add.includes(BW) ? BW : add.includes(COLOUR) ? COLOUR : null;
        tags = cleanTags([...tags, ...add.filter((t) => t !== BW && t !== COLOUR)]);
        if (colour) tags = withColourTag(tags, colour);
        update.tags = tags;
      }
      if (Object.keys(update).length === 0) return;
      const { error: e } = await db.from("photos").update(update).eq("id", row.id as string);
      if (e) throw new Error(e.message);
    }),
  );
  return (data ?? []).length;
}

export async function bulkDeletePhotos(ids: string[]) {
  await requireAdmin();
  for (const id of [...new Set(ids)].slice(0, 500)) await deletePhoto(id);
}

// A category name changed everywhere it is used (also merges with an existing category).
export async function renameCategory(from: string, to: string) {
  await requireAdmin();
  const target = canonicalTag(to);
  if (!target) throw new Error("Please give the category a name.");
  const db = createAdminClient();
  const { data } = await db.from("photos").select("id, tags").contains("tags", [from]);
  for (const row of data ?? []) {
    const tags = cleanTags(((row.tags as string[]) ?? []).map((t) => (t === from ? target : t)));
    const next = target === BW || target === COLOUR ? withColourTag(tags, target) : tags;
    const { error } = await db.from("photos").update({ tags: next }).eq("id", row.id as string);
    if (error) throw new Error(error.message);
  }
}

export async function deleteCategory(name: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from("photos").select("id, tags").contains("tags", [name]);
  for (const row of data ?? []) {
    const tags = ((row.tags as string[]) ?? []).filter((t) => t !== name);
    const { error } = await db.from("photos").update({ tags }).eq("id", row.id as string);
    if (error) throw new Error(error.message);
  }
}

// ---------- Comments ----------

export async function setCommentHidden(id: string, hidden: boolean) {
  await requireAdmin();
  const { error } = await createAdminClient().from("comments").update({ hidden }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteComment(id: string) {
  await requireAdmin();
  const { error } = await createAdminClient().from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
