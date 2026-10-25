"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "My photos" },
  { href: "/admin/upload", label: "Add photo" },
  { href: "/admin/albums", label: "Albums" },
  { href: "/admin/comments", label: "Comments" },
];

export function AdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

export function AdminNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav className="admin-nav" aria-label="Dashboard">
      {items.map((it) => {
        const active =
          pathname !== null &&
          (it.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/photos") : pathname.startsWith(it.href));
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}>
            {it.label}
          </Link>
        );
      })}
      <Link href="/" className="ml-auto">
        View website →
      </Link>
    </nav>
  );
}
