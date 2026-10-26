import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProtectedImage } from "@/components/protected-image";
import { formatDay, getPost, paragraphs } from "@/lib/content";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt || undefined } : { title: "Journal" };
}

async function Post({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const [lead, ...rest] = paragraphs(post.body);

  return (
    <article className="post">
      <header className="post-head">
        <Link href="/blog" className="label hover:text-[var(--ink)]">← Journal</Link>
        <span className="frame-no">{formatDay(post.published_on)}</span>
        <h1 className="serif">{post.title}</h1>
        {post.excerpt && <p className="text-[var(--ink-2)] text-[19px] max-w-[56ch]">{post.excerpt}</p>}
      </header>
      {post.cover && (
        <figure className="post-cover">
          <ProtectedImage src={post.cover.large} alt={post.title} width={post.cover.width} height={post.cover.height} priority />
        </figure>
      )}
      <div className="post-body">
        {lead && <p className="post-lead serif">{lead}</p>}
        {rest.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <footer className="post-foot">
        <Link href="/blog" className="arrow-link">More stories</Link>
      </footer>
    </article>
  );
}

export default function PostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <div className="wrap">
      <Suspense fallback={<p className="label pt-16">Loading story…</p>}>
        <Post params={props.params} />
      </Suspense>
    </div>
  );
}
