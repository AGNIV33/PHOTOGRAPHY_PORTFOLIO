import type { Metadata } from "next";
import { PageHead } from "@/components/page-head";
import { getSettings, socialLinks } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const links = socialLinks(settings).filter((s) => s.href);

  return (
    <div className="wrap">
      <PageHead
        index="04"
        title="Contact"
        intro="For exhibitions, features, or just to talk about a photograph."
      />
      <dl className="grid gap-8 md:grid-cols-3 max-w-4xl">
        <div className="grid gap-2">
          <dt className="label">Email</dt>
          <dd>
            {settings.email ? (
              <a href={`mailto:${settings.email}`} className="arrow-link">{settings.email}</a>
            ) : (
              <span className="text-muted">Coming soon</span>
            )}
          </dd>
        </div>
        {links.map((s) => (
          <div key={s.label} className="grid gap-2">
            <dt className="label">{s.label}</dt>
            <dd>
              <a href={s.href} target="_blank" rel="noreferrer" className="arrow-link">
                Open profile
              </a>
            </dd>
          </div>
        ))}
        {settings.city && (
          <div className="grid gap-2">
            <dt className="label">Based in</dt>
            <dd>{settings.city}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
