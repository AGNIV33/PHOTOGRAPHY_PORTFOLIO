import Link from "next/link";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div className="grid gap-2">
          <span className="font-semibold text-ink">{site.fullName}</span>
          <p className="max-w-[44ch]">
            All photographs © {site.fullName}. Please do not copy, download or reuse them without
            written permission.
          </p>
        </div>
        <div className="grid gap-2 content-start">
          <span className="label">Site</span>
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="grid gap-2 content-start">
          <span className="label">Follow</span>
          {site.social.map((s) =>
            s.href ? (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ) : (
              <span key={s.label} className="text-muted">
                {s.label} (link needed)
              </span>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
