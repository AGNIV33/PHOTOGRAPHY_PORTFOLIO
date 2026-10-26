import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { ListManager } from "@/components/admin/list-manager";
import { deleteAchievement, moveAchievement, saveAchievement } from "@/app/admin/content-actions";
import { adminListAchievements } from "@/lib/content";

async function Achievements() {
  const rows = await adminListAchievements();
  return (
    <ListManager
      noun="achievement"
      titleField="title"
      fields={[
        { name: "year", label: "Year", placeholder: "2024", width: "short" },
        { name: "title", label: "What it is", placeholder: "First prize, Kolkata Street Photo Festival" },
        { name: "detail", label: "More details (optional)", multiline: true },
        { name: "link", label: "Link for more information (optional)", placeholder: "https://…" },
      ]}
      items={rows.map((r) => ({ id: r.id, year: r.year, title: r.title, detail: r.detail, link: r.link }))}
      save={saveAchievement}
      remove={deleteAchievement}
      move={moveAchievement}
    />
  );
}

export default function AchievementsAdminPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/achievements">
        <Achievements />
      </AdminGate>
    </Suspense>
  );
}
