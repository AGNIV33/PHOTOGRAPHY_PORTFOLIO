import Link from "next/link";

const tabs = [
  { href: "/about", label: "About" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gear", label: "Gear" },
  { href: "/blog", label: "Journal" },
];

// Links between the About pages, so Achievements and Gear are one tap from About.
export function AboutTabs({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-[13px] tracking-[0.2em] uppercase" aria-label="About">
      {tabs.map((t) =>
        t.href === current ? (
          <span key={t.href} aria-current="page" className="text-[var(--safelight)] border-b border-[var(--safelight)] pb-1">
            {t.label}
          </span>
        ) : (
          <Link key={t.href} href={t.href} className="text-[var(--ink-2)] hover:text-[var(--ink)] pb-1">
            {t.label}
          </Link>
        ),
      )}
    </nav>
  );
}
