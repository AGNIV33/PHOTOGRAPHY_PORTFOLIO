import type { Metadata } from "next";
import Link from "next/link";
import { AboutTabs } from "@/components/about-tabs";
import { EmptyState, PageHead } from "@/components/page-head";
import { ProtectedImage } from "@/components/protected-image";
import { formatDay, listPosts } from "@/lib/content";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const posts = await listPosts();
  return (
    <div className="wrap">
      <PageHead index="03" title="Journal" intro="Stories and notes from the street." />
      <AboutTabs current="/blog" />
      {posts.length === 0 ? (
        <EmptyState title="No posts yet." body="Stories will appear here soon." />
      ) : (
        <ol className="post-list">
          {posts.map((p, i) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="post-row group" data-cover={p.cover ? "yes" : "no"}>
                {p.cover && (
                  <ProtectedImage src={p.cover.thumb} alt="" width={p.cover.width} height={p.cover.height} className="post-row-cover" priority={i === 0} />
                )}
                <span className="grid gap-3 content-start">
                  <span className="frame-no">{formatDay(p.published_on)}</span>
                  <span className="serif post-row-title">{p.title}</span>
                  {p.excerpt && <span className="text-[var(--ink-2)] max-w-[60ch]">{p.excerpt}</span>}
                  <span className="label group-hover:text-[var(--safelight)]">Read the story →</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
