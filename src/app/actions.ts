"use server";

import { displayName, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Visitor actions. Row level security makes sure people can only act as themselves.

export async function toggleLike(photoId: string) {
  const user = await getUser();
  if (!user) throw new Error("Please sign in to like photos.");
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("likes")
    .select("photo_id")
    .eq("photo_id", photoId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("likes").delete().eq("photo_id", photoId).eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({ photo_id: photoId, user_id: user.id });
  }
}

export async function addComment(photoId: string, body: string) {
  const user = await getUser();
  if (!user) throw new Error("Please sign in to comment.");
  const text = body.trim().slice(0, 1000);
  if (!text) return;
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    photo_id: photoId,
    user_id: user.id,
    author_name: displayName(user),
    body: text,
  });
  if (error) throw new Error("Could not post your comment. Please try again.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
