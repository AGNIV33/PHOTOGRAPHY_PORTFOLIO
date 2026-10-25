import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "Achievements" };

export default function AchievementsPage() {
  return (
    <div className="wrap">
      <PageHead index="04" title="Achievements" intro="Awards, exhibitions and features." />
      <EmptyState title="No achievements listed yet." body="Awards and exhibitions added in the admin dashboard will appear here." />
    </div>
  );
}
