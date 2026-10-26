import "server-only";
import type { User } from "@supabase/supabase-js";
import { imageUrl, swatchUrl } from "@/lib/cloudinary";
import { isBackendReady } from "@/lib/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type Visibility = "public" | "members";

export type PhotoRow = {
  id: string;
  public_id: string;
  width: number;
  height: number;
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
  created_at: string;
};

export type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  story: string;
  cover_photo_id: string | null;
  position: number;
  created_at: string;
};

export type PhotoView = Omit<PhotoRow, "public_id"> & {
  locked: boolean;
  // 720px, for the home page.
  card: string | null;
  // Tiny copy for reading the photo's colours on the server.
  swatch: string | null;
  thumb: string | null;
  large: string | null;
};

export type AlbumView = AlbumRow & { count: number; cover: PhotoView | null };

export type CommentRow = {
  id: string;
  photo_id: string;
  user_id: string;
  author_name: string;
  body: string;
  hidden: boolean;
  created_at: string;
};

const PHOTO_FIELDS =
  "id, public_id, width, height, caption, place, taken_at, camera, lens, focal_length, aperture, shutter, iso, album_id, visibility, status, created_at";

// Members-only photos get no image link unless someone is signed in.
export function toView(row: PhotoRow, user: User | null): PhotoView {
  const { public_id, ...rest } = row;
  const locked = row.visibility === "members" && !user;
  return {
    ...rest,
    locked,
    card: locked ? null : imageUrl(public_id, "card"),
    swatch: locked ? null : swatchUrl(public_id),
    thumb: locked ? null : imageUrl(public_id, "thumb"),
    large: locked ? null : imageUrl(public_id, "large"),
  };
}

export async function listPhotos(user: User | null, opts: { albumId?: string; limit?: number } = {}) {
  if (!isBackendReady) return [];
  const supabase = await createClient();
  let q = supabase
    .from("photos")
    .select(PHOTO_FIELDS)
    .eq("status", "published")
    // Newest upload first; the id only settles ties so the order never jumps around.
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (opts.albumId) q = q.eq("album_id", opts.albumId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return ((data ?? []) as PhotoRow[]).map((r) => toView(r, user));
}

export async function getPhoto(id: string, user: User | null) {
  if (!isBackendReady) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("photos").select(PHOTO_FIELDS).eq("id", id).maybeSingle();
  return data ? toView(data as PhotoRow, user) : null;
}

export async function listAlbums(user: User | null): Promise<AlbumView[]> {
  if (!isBackendReady) return [];
  const supabase = await createClient();
  const [{ data: albums }, { data: photos }] = await Promise.all([
    supabase.from("albums").select("*").order("position").order("created_at"),
    supabase.from("photos").select(PHOTO_FIELDS).eq("status", "published"),
  ]);
  const rows = (photos ?? []) as PhotoRow[];
  return ((albums ?? []) as AlbumRow[]).map((a) => {
    const inAlbum = rows.filter((p) => p.album_id === a.id);
    // Cover: the chosen photo, else the first open photo, so locked covers are rare.
    const coverRow =
      inAlbum.find((p) => p.id === a.cover_photo_id) ??
      inAlbum.find((p) => p.visibility === "public") ??
      inAlbum[0];
    return { ...a, count: inAlbum.length, cover: coverRow ? toView(coverRow, user) : null };
  });
}

export async function getAlbum(slug: string) {
  if (!isBackendReady) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("albums").select("*").eq("slug", slug).maybeSingle();
  return (data as AlbumRow | null) ?? null;
}

export async function getEngagement(photoId: string, user: User | null) {
  const supabase = await createClient();
  const [{ count }, mine, { data: comments }] = await Promise.all([
    supabase.from("likes").select("*", { count: "exact", head: true }).eq("photo_id", photoId),
    user
      ? supabase.from("likes").select("photo_id").eq("photo_id", photoId).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id, photo_id, user_id, author_name, body, hidden, created_at")
      .eq("photo_id", photoId)
      .order("created_at"),
  ]);
  return {
    likes: count ?? 0,
    liked: Boolean(mine.data),
    comments: (comments ?? []) as CommentRow[],
  };
}

// ---------- Admin (secret key; callers must have checked requireAdmin) ----------

export async function adminListPhotos() {
  const { data } = await createAdminClient()
    .from("photos")
    .select(PHOTO_FIELDS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  return (data ?? []) as PhotoRow[];
}

export async function adminGetPhoto(id: string) {
  const { data } = await createAdminClient()
    .from("photos")
    .select(PHOTO_FIELDS)
    .eq("id", id)
    .maybeSingle();
  return (data as PhotoRow | null) ?? null;
}

export async function adminListAlbums() {
  const { data } = await createAdminClient()
    .from("albums")
    .select("*")
    .order("position")
    .order("created_at");
  return (data ?? []) as AlbumRow[];
}

export async function adminListComments() {
  const { data } = await createAdminClient()
    .from("comments")
    .select("id, photo_id, user_id, author_name, body, hidden, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as CommentRow[];
}
