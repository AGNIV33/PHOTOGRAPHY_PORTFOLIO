"use server";

import { requireAdmin } from "@/lib/auth";
import { deleteImage, signUpload } from "@/lib/cloudinary";
import { adminGetPhoto, type Visibility } from "@/lib/photos";
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
  };
}

// ---------- Photos ----------

export async function getUploadSignature() {
  await requireAdmin();
  return signUpload();
}

export async function createPhoto(
  upload: { public_id: string; width: number; height: number },
  input: PhotoInput,
) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("photos")
    .insert({ ...clean(input), ...upload });
  if (error) {
    // Don't leave an orphan file in Cloudinary if the record could not be saved.
    await deleteImage(upload.public_id).catch(() => {});
    throw new Error(error.message);
  }
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
export async function deleteAlbum(id: string) {
  await requireAdmin();
  const { error } = await createAdminClient().from("albums").delete().eq("id", id);
  if (error) throw new Error(error.message);
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
