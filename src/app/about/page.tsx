import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHead } from "@/components/page-head";
import { site } from "@/config/site";
import { getSettings, paragraphs } from "@/lib/content";
import { getHeroImages } from "@/lib/hero-images";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const settings = await getSettings();
  const [lead, ...rest] = paragraphs(settings.about);
  const portrait = getHeroImages()[0];

  return (
    <div className="wrap">
      <PageHead index="06" title="About" intro={`${site.role}${settings.city ? `, ${settings.city}` : ""}.`} />
      {!lead ? (
        <EmptyState title="About text coming soon." body="The photographer's story will appear here." />
      ) : (
        <div className="about">
          {portrait && (
            <figure className="about-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} alt={`Portrait of ${site.name}`} draggable={false} />
            </figure>
          )}
          <div className="post-body">
            <p className="post-lead serif">{lead}</p>
            {rest.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <nav className="flex flex-wrap gap-x-8 gap-y-3 pt-6" aria-label="More about">
              <Link href="/achievements" className="arrow-link">Achievements</Link>
              <Link href="/gear" className="arrow-link">Gear</Link>
              <Link href="/contact" className="arrow-link">Contact</Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
