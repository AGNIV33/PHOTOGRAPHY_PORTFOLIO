import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/page-head";
import { PhotoGrid } from "@/components/photo-tile";
import { getUser } from "@/lib/auth";
import { getAlbum, listPhotos } from "@/lib/photos";

async function Album({ params }: { params: PageProps<"/albums/[slug]">["params"] }) {
  const { slug } = await params;
  const album = await getAlbum(slug);
  if (!album) notFound();
  const user = await getUser();
  const photos = await listPhotos(user, { albumId: album.id });

  return (
    <>
      <header className="page-head">
        <Link href="/albums" className="label hover:text-[var(--ink)]">← All albums</Link>
        <h1>{album.title}</h1>
        {album.story && <p className="serif text-[22px] leading-snug whitespace-pre-line">{album.story}</p>}
        <span className="frame-no">
          {photos.length} photograph{photos.length === 1 ? "" : "s"}
        </span>
      </header>
      {photos.length ? (
        <PhotoGrid photos={photos} />
      ) : (
        <EmptyState title="This album is empty." body="Photos will appear here soon." />
      )}
    </>
  );
}

export default function AlbumPage(props: PageProps<"/albums/[slug]">) {
  return (
    <div className="wrap">
      <Suspense fallback={<p className="label pt-16">Loading album…</p>}>
        <Album params={props.params} />
      </Suspense>
    </div>
  );
}
