import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";
import { listGear } from "@/lib/content";

export const metadata: Metadata = { title: "Gear" };

export default async function GearPage() {
  const rows = await listGear();
  // Keep the order he chose, grouped by type in order of first appearance.
  const groups = new Map<string, typeof rows>();
  for (const g of rows) groups.set(g.kind || "Other", [...(groups.get(g.kind || "Other") ?? []), g]);

  return (
    <div className="wrap">
      <PageHead index="05" title="Gear" intro="The cameras and lenses behind the photographs." />
      {rows.length === 0 ? (
        <EmptyState title="No gear listed yet." body="Cameras and lenses will appear here soon." />
      ) : (
        <div className="grid gap-16">
          {[...groups].map(([kind, items]) => (
            <section key={kind} className="grid gap-2">
              <span className="kicker">{kind}</span>
              <ol className="ledger">
                {items.map((g, i) => (
                  <li key={g.id} className="ledger-row ledger-row-2">
                    <span className="frame-no ledger-year">{String(i + 1).padStart(2, "0")}</span>
                    <div className="grid gap-2">
                      <p className="serif ledger-title">{g.name}</p>
                      {g.note && <p className="text-[var(--ink-2)] max-w-[62ch]">{g.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
