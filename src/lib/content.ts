import "server-only";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { site } from "@/config/site";
import { imageUrl, previewImageUrl } from "@/lib/cloudinary";
import { isBackendReady, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

// Journal posts, achievements, gear and the About/contact details.
// They are the same for every visitor, so public reads are cached and the dashboard
// clears the cache (updateTag) whenever the photographer saves.

export const CONTENT_TAGS = {
  posts: "posts",
  achievements: "achievements",
  gear: "gear",
  settings: "settings",
} as const;

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_public_id: string | null;
  cover_width: number | null;
  cover_height: number | null;
  published_on: string;
  status: "draft" | "published";
  created_at: string;
};

export type PostView = Omit<PostRow, "cover_public_id"> & {
  cover: { thumb: string; large: string; width: number; height: number } | null;
};

export type AchievementRow = {
  id: string;
  year: string;
  title: string;
  detail: string;
  link: string;
  link_site: string;
  link_title: string;
  link_description: string;
  // Cloudinary id of the picture on the link card ("" when there is none).
  link_image: string;
  position: number;
};

export type AchievementView = Omit<AchievementRow, "link_image"> & { link_image_url: string | null };

export type GearRow = {
  id: string;
  kind: string;
  name: string;
  note: string;
  position: number;
};

export type Settings = {
  about: string;
  city: string;
  email: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
};

const POST_FIELDS =
  "id, slug, title, excerpt, body, cover_public_id, cover_width, cover_height, published_on, status, created_at";

// Anonymous reads without cookies, so the results can be cached for everyone.
function publicClient() {
  return createPlainClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function toPostView(row: PostRow): PostView {
  const { cover_public_id, ...rest } = row;
  return {
    ...rest,
    cover:
      cover_public_id && isBackendReady
        ? {
            thumb: imageUrl(cover_public_id, "thumb"),
            large: imageUrl(cover_public_id, "large"),
            width: row.cover_width ?? 3,
            height: row.cover_height ?? 2,
          }
        : null,
  };
}

// "2026-10-26" → "26 October 2026", without time zones getting in the way.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function formatDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : day;
}

// A blank line starts a new paragraph.
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ---------- Public (cached) ----------

export async function listPosts(): Promise<PostView[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.posts);
  if (!isSupabaseConfigured) return [];
  const { data } = await publicClient()
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .order("published_on", { ascending: false })
    .order("created_at", { ascending: false });
  return ((data ?? []) as PostRow[]).map(toPostView);
}

export async function getPost(slug: string): Promise<PostView | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.posts);
  if (!isSupabaseConfigured) return null;
  const { data } = await publicClient()
    .from("posts")
    .select(POST_FIELDS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? toPostView(data as PostRow) : null;
}

export function toAchievementView(row: AchievementRow): AchievementView {
  const { link_image, ...rest } = row;
  return { ...rest, link_image_url: link_image && isBackendReady ? previewImageUrl(link_image) : null };
}

export async function listAchievements(): Promise<AchievementView[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.achievements);
  if (!isSupabaseConfigured) return [];
  const { data } = await publicClient().from("achievements").select("*").order("position").order("created_at");
  return ((data ?? []) as AchievementRow[]).map(toAchievementView);
}

export async function listGear(): Promise<GearRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.gear);
  if (!isSupabaseConfigured) return [];
  const { data } = await publicClient().from("gear").select("*").order("position").order("created_at");
  return (data ?? []) as GearRow[];
}

const DEFAULT_SETTINGS: Settings = {
  about: "",
  city: site.city,
  email: "",
  instagram: site.social.find((s) => s.label === "Instagram")?.href ?? "",
  facebook: site.social.find((s) => s.label === "Facebook")?.href ?? "",
  whatsapp: "",
};

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAGS.settings);
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data } = await publicClient()
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  // Empty boxes in the dashboard fall back to the defaults.
  const s = { ...DEFAULT_SETTINGS, ...(data as Partial<Settings>) };
  return {
    about: s.about || DEFAULT_SETTINGS.about,
    city: s.city || DEFAULT_SETTINGS.city,
    email: s.email || DEFAULT_SETTINGS.email,
    instagram: s.instagram || DEFAULT_SETTINGS.instagram,
    facebook: s.facebook || DEFAULT_SETTINGS.facebook,
    whatsapp: s.whatsapp || DEFAULT_SETTINGS.whatsapp,
  };
}

export function socialLinks(s: Settings) {
  return [
    { label: "Instagram", href: s.instagram },
    { label: "WhatsApp", href: s.whatsapp },
    { label: "Facebook", href: s.facebook },
  ];
}

// ---------- Admin (secret key; callers must have checked requireAdmin) ----------

export async function adminListPosts() {
  const { data } = await createAdminClient()
    .from("posts")
    .select(POST_FIELDS)
    .order("published_on", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as PostRow[];
}

export async function adminGetPost(id: string) {
  const { data } = await createAdminClient().from("posts").select(POST_FIELDS).eq("id", id).maybeSingle();
  return (data as PostRow | null) ?? null;
}

export async function adminListAchievements() {
  const { data } = await createAdminClient().from("achievements").select("*").order("position").order("created_at");
  return (data ?? []) as AchievementRow[];
}

export async function adminListGear() {
  const { data } = await createAdminClient().from("gear").select("*").order("position").order("created_at");
  return (data ?? []) as GearRow[];
}

export async function adminGetSettings(): Promise<Settings> {
  const { data } = await createAdminClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
  return { about: "", city: "", email: "", instagram: "", facebook: "", whatsapp: "", ...((data as Partial<Settings> | null) ?? {}) };
}

// The year for the footer. Cached for a day so the page can still be prerendered.
export async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
