import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Comments, LikeButton } from "@/components/engagement";
import { ProtectedImage } from "@/components/protected-image";
import { getUser } from "@/lib/auth";
import { isBackendReady } from "@/lib/env";
import { getEngagement, getPhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

async function Photo({ params }: { params: PageProps<"/photo/[id]">["params"] }) {
  const { id } = await params;
  if (!isBackendReady || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await getUser();
  const photo = await getPhoto(id, user);
  if (!photo) notFound();

  if (photo.locked || !photo.large) {
    return (
      <div className="grid gap-6 py-20 max-w-xl">
        <span className="kicker">Members only</span>
        <p className="serif text-[32px] leading-tight">Sign in to see this photograph.</p>
        <Link href={`/signin?next=/photo/${photo.id}`} className="btn btn-primary w-fit">Sign in</Link>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ likes, liked, comments }, album] = await Promise.all([
    getEngagement(photo.id, user),
    photo.album_id
      ? supabase.from("albums").select("slug, title").eq("id", photo.album_id).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const exif = [
    photo.camera,
    photo.lens,
    photo.focal_length,
    photo.aperture,
    photo.shutter,
    photo.iso && `ISO ${photo.iso}`,
  ].filter(Boolean);
  const date = photo.taken_at
    ? new Date(photo.taken_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <article className="grid gap-10 pt-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <ProtectedImage src={photo.large} alt={photo.caption} width={photo.width} height={photo.height} className="photo-large" priority />
      </div>
      <aside className="lg:col-span-4 grid gap-6 content-start">
        {album && (
          <Link href={`/albums/${album.slug}`} className="kicker hover:text-[var(--ink)]">
            {album.title}
          </Link>
        )}
        {photo.caption && <h1 className="serif text-[clamp(28px,3vw,40px)] leading-tight font-normal tracking-normal">{photo.caption}</h1>}
        <dl className="grid gap-3 text-[15px]">
          {photo.place && (
            <div className="grid gap-0.5">
              <dt className="label">Place</dt>
              <dd>{photo.place}</dd>
            </div>
          )}
          {date && (
            <div className="grid gap-0.5">
              <dt className="label">Date</dt>
              <dd>{date}</dd>
            </div>
          )}
          {exif.length > 0 && (
            <div className="grid gap-0.5">
              <dt className="label">Camera</dt>
              <dd className="font-mono text-[13px] text-[var(--ink-2)]">{exif.join(" · ")}</dd>
            </div>
          )}
        </dl>
        <LikeButton photoId={photo.id} likes={likes} liked={liked} signedIn={Boolean(user)} />
        <Comments photoId={photo.id} comments={comments} signedIn={Boolean(user)} />
      </aside>
    </article>
  );
}

export default function PhotoPage(props: PageProps<"/photo/[id]">) {
  return (
    <div className="wrap">
      <Suspense fallback={<p className="label pt-16">Loading photograph…</p>}>
        <Photo params={props.params} />
      </Suspense>
    </div>
  );
}
