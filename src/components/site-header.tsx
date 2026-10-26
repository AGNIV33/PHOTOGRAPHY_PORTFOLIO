"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AccountMenu, accountNames, useLogOut, useSignedInUser } from "@/components/account-menu";
import { site } from "@/config/site";

// The current path is only known at request time, so the header renders once without it
// (static shell) and again with it.
export function SiteHeader() {
  return <SiteHeaderView pathname={usePathname()} />;
}

export function SiteHeaderView({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const overlay = pathname === "/";

  const isActive = (match: readonly string[]) =>
    pathname !== null &&
    match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`)));

  return (
    <header className="site-header" data-overlay={overlay ? "" : undefined}>
      <div className="wrap bar">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)} aria-label={`${site.name} Photography, home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={36} height={36} className="wordmark-mark" draggable={false} />
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
            <AdminNavLink pathname={pathname} />
          </nav>
          <AccountMenu />
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
          <MobileAccountLinks close={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}

function MobileAccountLinks({ close }: { close: () => void }) {
  const { user, ready } = useSignedInUser();
  const logOut = useLogOut();
  if (!ready) return null;
  if (!user) {
    return (
      <>
        <Link href="/signin" onClick={close}>Sign in</Link>
        <Link href="/signup" onClick={close}>Create account</Link>
      </>
    );
  }
  const names = accountNames(user);
  return (
    <>
      {names.admin && <Link href="/admin" onClick={close}>Admin</Link>}
      <button
        type="button"
        className="mobile-logout"
        onClick={async () => {
          close();
          await logOut();
        }}
      >
        Log out
        <span className="label">{names.first}</span>
      </button>
    </>
  );
}

// Only the two admin accounts see this. It is just a shortcut: the dashboard pages
// check the admin again on the server, so the link alone gives nobody any access.
function AdminNavLink({ pathname }: { pathname: string | null }) {
  const { user } = useSignedInUser();
  if (!user || !accountNames(user).admin) return null;
  return (
    <Link href="/admin" data-admin="" aria-current={pathname?.startsWith("/admin") ? "page" : undefined}>
      Admin
    </Link>
  );
}
