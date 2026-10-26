import type { Metadata } from "next";
import { AboutTabs } from "@/components/about-tabs";
import { EmptyState, PageHead } from "@/components/page-head";
import { listAchievements } from "@/lib/content";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const rows = await listAchievements();
  return (
    <div className="wrap">
      <PageHead index="04" title="Achievements" intro="Awards, exhibitions and features." />
      <AboutTabs current="/achievements" />
      {rows.length === 0 ? (
        <EmptyState title="No achievements listed yet." body="Awards and exhibitions will appear here soon." />
      ) : (
        <ol className="ledger">
          {rows.map((a) => (
            <li key={a.id} className="ledger-row">
              <span className="frame-no ledger-year">{a.year || "—"}</span>
              <div className="grid gap-2">
                <p className="serif ledger-title">{a.title}</p>
                {a.detail && <p className="text-[var(--ink-2)] max-w-[62ch] whitespace-pre-line">{a.detail}</p>}
              </div>
              {a.link ? (
                <a href={a.link} target="_blank" rel="noreferrer" className="label ledger-link hover:text-[var(--safelight)]">
                  More →
                </a>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
