"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteImage, deletePreviewImage, importPreviewImage, PREVIEW_FOLDER, signPreviewUpload } from "@/lib/cloudinary";
import { adminGetPost, CONTENT_TAGS, type Settings } from "@/lib/content";
import { fetchLinkPreview as readLinkPreview, parseWebAddress } from "@/lib/link-preview";
import { slugify, uniqueSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/server";

const text = (s: string | null | undefined, max = 300) => (s ?? "").trim().slice(0, max);

// Accepts "instagram.com/name" or a full link. Anything that is not a web link is refused,
// so a typo can never turn into a harmful link on the website.
function webLink(raw: string, what: string) {
  const s = text(raw, 500);
  if (!s) return "";
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`The ${what} link doesn't look right. Copy it from the browser's address bar.`);
  }
}

type Table = "achievements" | "gear";

async function nextPosition(table: Table) {
  const { count } = await createAdminClient().from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function move(table: Table, id: string, direction: -1 | 1) {
  const db = createAdminClient();
  const { data } = await db.from(table).select("id").order("position").order("created_at");
  const ids = (data ?? []).map((r) => r.id as string);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((rowId, position) => db.from(table).update({ position }).eq("id", rowId)));
}

// ---------- Journal ----------

export type PostInput = {
  title: string;
  excerpt: string;
  body: string;
  published_on: string;
  status: "draft" | "published";
  cover: { public_id: string; width: number; height: number } | null;
};

// Creates the post when id is null. Returns the post's id.
export async function savePost(id: string | null, input: PostInput) {
  await requireAdmin();
  const title = text(input.title, 200);
  if (!title) throw new Error("Please give the post a title.");
  const db = createAdminClient();
  const fields = {
    title,
    excerpt: text(input.excerpt, 400),
    body: text(input.body, 50000),
    published_on: /^\d{4}-\d{2}-\d{2}$/.test(input.published_on) ? input.published_on : undefined,
    status: input.status === "draft" ? "draft" : "published",
    cover_public_id: input.cover?.public_id ?? null,
    cover_width: input.cover?.width ?? null,
    cover_height: input.cover?.height ?? null,
  };

  let postId = id;
  if (id) {
    const before = await adminGetPost(id);
    if (!before) throw new Error("This post no longer exists.");
    const { error } = await db.from("posts").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    // The old cover was replaced or removed: delete the file too.
    if (before.cover_public_id && before.cover_public_id !== fields.cover_public_id) {
      await deleteImage(before.cover_public_id).catch(() => {});
    }
  } else {
    const base = slugify(title, "post");
    const { data: taken } = await db.from("posts").select("slug").like("slug", `${base}%`);
    const slug = uniqueSlug(base, new Set((taken ?? []).map((r) => r.slug as string)));
    const { data, error } = await db.from("posts").insert({ ...fields, slug }).select("id").single();
    if (error) throw new Error(error.message);
    postId = data.id as string;
  }
  updateTag(CONTENT_TAGS.posts);
  return postId as string;
}

export async function deletePost(id: string) {
  await requireAdmin();
  const post = await adminGetPost(id);
  if (!post) return;
  const { error } = await createAdminClient().from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (post.cover_public_id) await deleteImage(post.cover_public_id).catch(() => {});
  updateTag(CONTENT_TAGS.posts);
}

// A cover was uploaded but the post was never saved: remove the file again.
export async function discardCover(publicId: string) {
  await requireAdmin();
  const { count } = await createAdminClient()
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("cover_public_id", publicId);
  if (!count) await deleteImage(publicId).catch(() => {});
}

// ---------- Achievements ----------

export type AchievementInput = {
  year: string;
  title: string;
  detail: string;
  link: string;
  link_site: string;
  link_title: string;
  link_description: string;
  // The link card's picture: one already stored, a web address to copy in, or none.
  image: { public_id: string } | { remote_url: string } | null;
};

export async function getPreviewUploadSignature() {
  await requireAdmin();
  return signPreviewUpload();
}

// Looks at the linked page and returns what it shares. Admin only; nothing is saved yet.
export async function fetchLinkPreview(rawLink: string) {
  await requireAdmin();
  const link = webLink(rawLink, "more information");
  if (!link) return { error: "Paste a link first." as string };
  try {
    return { link, preview: await readLinkPreview(link) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The link could not be read." };
  }
}

export async function saveAchievement(id: string | null, input: AchievementInput): Promise<{ warning?: string }> {
  await requireAdmin();
  const title = text(input.title, 200);
  if (!title) throw new Error("Please write what the achievement is.");
  const link = webLink(input.link, "more information");
  if (link) parseWebAddress(link); // same address rules as the preview fetch
  const db = createAdminClient();

  const before = id
    ? ((await db.from("achievements").select("link_image").eq("id", id).maybeSingle()).data as { link_image: string } | null)
    : null;

  let warning: string | undefined;
  let image = "";
  if (link && input.image) {
    if ("public_id" in input.image) {
      // Only pictures inside the previews folder can be attached (never his photographs).
      if (!input.image.public_id.startsWith(`${PREVIEW_FOLDER}/`)) throw new Error("That picture can't be used.");
      image = input.image.public_id;
    } else if (input.image.remote_url) {
      try {
        const u = new URL(input.image.remote_url);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
        image = await importPreviewImage(u.toString());
      } catch {
        warning = "Saved, but the picture could not be copied. You can upload one yourself.";
      }
    }
  }

  const fields = {
    year: text(input.year, 20),
    title,
    detail: text(input.detail, 600),
    link,
    link_site: link ? text(input.link_site, 80) : "",
    link_title: link ? text(input.link_title, 200) : "",
    link_description: link ? text(input.link_description, 400) : "",
    link_image: link ? image : "",
  };
  const { error } = id
    ? await db.from("achievements").update(fields).eq("id", id)
    : await db.from("achievements").insert({ ...fields, position: await nextPosition("achievements") });
  if (error) {
    if (image && image !== before?.link_image) await deletePreviewImage(image).catch(() => {});
    throw new Error(error.message);
  }
  // A replaced or removed picture is deleted from storage too.
  if (before?.link_image && before.link_image !== fields.link_image) {
    await deletePreviewImage(before.link_image).catch(() => {});
  }
  updateTag(CONTENT_TAGS.achievements);
  return warning ? { warning } : {};
}

export async function deleteAchievement(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from("achievements").select("link_image").eq("id", id).maybeSingle();
  const { error } = await db.from("achievements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (data?.link_image) await deletePreviewImage(data.link_image as string).catch(() => {});
  updateTag(CONTENT_TAGS.achievements);
}

export async function moveAchievement(id: string, direction: -1 | 1) {
  await requireAdmin();
  await move("achievements", id, direction);
  updateTag(CONTENT_TAGS.achievements);
}

// ---------- Gear ----------

export type GearInput = { kind: string; name: string; note: string };

export async function saveGear(id: string | null, input: GearInput) {
  await requireAdmin();
  const name = text(input.name, 200);
  if (!name) throw new Error("Please write the name of the camera or lens.");
  const fields = { kind: text(input.kind, 40) || "Other", name, note: text(input.note, 400) };
  const db = createAdminClient();
  const { error } = id
    ? await db.from("gear").update(fields).eq("id", id)
    : await db.from("gear").insert({ ...fields, position: await nextPosition("gear") });
  if (error) throw new Error(error.message);
  updateTag(CONTENT_TAGS.gear);
}

export async function deleteGear(id: string) {
  await requireAdmin();
  const { error } = await createAdminClient().from("gear").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CONTENT_TAGS.gear);
}

export async function moveGear(id: string, direction: -1 | 1) {
  await requireAdmin();
  await move("gear", id, direction);
  updateTag(CONTENT_TAGS.gear);
}

// ---------- About and links ----------

export async function saveSettings(input: Settings) {
  await requireAdmin();
  const email = text(input.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("The email address doesn't look right.");
  }
  const { error } = await createAdminClient()
    .from("site_settings")
    .upsert({
      id: 1,
      about: text(input.about, 20000),
      city: text(input.city, 100),
      email,
      instagram: webLink(input.instagram, "Instagram"),
      facebook: webLink(input.facebook, "Facebook"),
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
  updateTag(CONTENT_TAGS.settings);
}
