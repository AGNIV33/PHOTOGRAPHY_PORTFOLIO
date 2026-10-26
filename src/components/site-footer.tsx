import Link from "next/link";
import { site } from "@/config/site";
import { getSettings, socialLinks } from "@/lib/content";

export async function SiteFooter() {
  const links = socialLinks(await getSettings()).filter((s) => s.href);
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div className="grid gap-3 content-start">
          <span className="display text-[34px] text-ink">{site.name}</span>
          <p className="max-w-[44ch]">
            All photographs © {site.name}. Please do not copy, download or reuse them without
            written permission.
          </p>
        </div>
        <div className="grid gap-2 content-start">
          <span className="label">Explore</span>
          {site.more.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/signin">Sign in</Link>
        </div>
        <div className="grid gap-2 content-start">
          <span className="label">Follow</span>
          {links.length ? (
            links.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))
          ) : (
            <span className="text-muted">Links coming soon</span>
          )}
        </div>
      </div>
    </footer>
  );
}
