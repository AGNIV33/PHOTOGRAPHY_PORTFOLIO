import Link from "next/link";
import { site } from "@/config/site";
import { currentYear, getSettings, socialLinks } from "@/lib/content";

const ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </>
  ),
  WhatsApp: (
    <>
      <path d="M20.4 11.7a8.4 8.4 0 0 1-12.5 7.3L3.6 20.4l1.4-4.1a8.4 8.4 0 1 1 15.4-4.6z" />
      <path d="M9.2 8.6c-.2.3-.4.9-.1 1.7.6 1.6 2.4 3.5 4.2 4.1.8.3 1.4 0 1.7-.3l.5-.8-1.9-1-.7.7c-.8-.3-1.9-1.4-2.2-2.2l.7-.7-.9-1.9z" />
    </>
  ),
  Facebook: <path d="M17.5 3h-2.8a4.7 4.7 0 0 0-4.7 4.7V10H7.5v3.6H10V21h3.6v-7.4h2.8l.6-3.6h-3.4V8a1 1 0 0 1 1-1h2.9z" />,
};

function SocialIcon({ label, href }: { label: string; href: string }) {
  const svg = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[label]}
    </svg>
  );
  // No link yet: the icon is shown greyed out and cannot be clicked.
  if (!href) {
    return (
      <span className="social-icon" data-disabled="" role="img" aria-label={`${label}, link coming soon`} title={`${label}: link coming soon`}>
        {svg}
      </span>
    );
  }
  return (
    <a className="social-icon" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} title={label}>
      {svg}
    </a>
  );
}

export async function SiteFooter() {
  const [settings, year] = await Promise.all([getSettings(), currentYear()]);
  const social = socialLinks(settings);
  const instagram = social.find((s) => s.label === "Instagram")?.href ?? "";

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <p className="footer-headline serif">
            Every frame holds a <em>story.</em>
          </p>
          <Link href="/contact" className="footer-cta">
            Let&apos;s connect <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="footer-cols">
          <div className="footer-brand">
            <div className="footer-name">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" width={44} height={44} draggable={false} />
              <span className="display">{site.name}</span>
            </div>
            <span className="footer-role">
              {site.role} · India
            </span>
            <p className="footer-tagline">{site.tagline}</p>
            <div className="footer-social">
              {social.map((s) => (
                <SocialIcon key={s.label} label={s.label} href={s.href} />
              ))}
            </div>
          </div>

          <nav className="footer-col" aria-label="Explore">
            <span className="footer-label">Explore</span>
            {site.more.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="footer-col" aria-label="Connect">
            <span className="footer-label">Connect</span>
            <Link href="/contact">Contact</Link>
            {instagram ? (
              <a href={instagram} target="_blank" rel="noopener noreferrer">
                Instagram<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span className="footer-off">Instagram</span>
            )}
            <Link href="/about">About the photographer</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>© {year} {site.name}. All photographs reserved.</span>
          <span>— Made with care · India</span>
        </div>
      </div>
    </footer>
  );
}
