import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/config/site";
import { emailjsReady } from "@/lib/contact";
import { getSettings, socialLinks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to ${site.name}: exhibitions, features, licensing, or just a word about a photograph.`,
};

export default async function ContactPage() {
  const settings = await getSettings();
  const links = socialLinks(settings).filter((s) => s.href);

  return (
    <div className="wrap contact">
      <aside className="contact-side">
        <header className="contact-head">
          <span className="kicker">Contact</span>
          <h1 className="display">Let&apos;s talk</h1>
          <p className="serif">For exhibitions, features, licensing, or just a word about a photograph.</p>
        </header>

        <dl className="contact-facts">
          <div>
            <dt className="label">Email</dt>
            <dd>
              {settings.email ? (
                <a href={`mailto:${settings.email}`} className="arrow-link">
                  {settings.email}
                </a>
              ) : (
                <span className="text-muted">{emailjsReady ? "Use the form" : "Coming soon"}</span>
              )}
            </dd>
          </div>
          {settings.city && (
            <div>
              <dt className="label">Based in</dt>
              <dd>{settings.city}, India</dd>
            </div>
          )}
          {links.length > 0 && (
            <div>
              <dt className="label">Elsewhere</dt>
              <dd className="contact-links">
                {links.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="arrow-link">
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </aside>

      <section className="contact-main" aria-label="Send a message">
        <ContactForm directEmail={settings.email} />
      </section>
    </div>
  );
}
