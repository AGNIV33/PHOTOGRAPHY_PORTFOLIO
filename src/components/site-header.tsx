"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const overlay = pathname === "/";

  const isActive = (match: readonly string[]) =>
    match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`)));

  return (
    <header className="site-header" data-overlay={overlay ? "" : undefined}>
      <div className="wrap bar">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
          {site.name}
          <span className="sep" aria-hidden="true" />
          <span className="sub">Photography</span>
        </Link>

        <div className="header-actions">
          <nav className="nav" aria-label="Main">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.match) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="wrap mobile-nav" aria-label="Main">
          {[...site.nav, ...site.more.filter((m) => m.href !== "/gallery")].map((item, i) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
              <span className="frame-no">{String(i + 1).padStart(2, "0")}</span>
            </Link>
          ))}
          <Link href="/signin" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
