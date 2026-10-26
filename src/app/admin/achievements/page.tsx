import { Suspense } from "react";
import { AchievementsManager } from "@/components/admin/achievements-manager";
import { AdminGate } from "@/components/admin/admin-gate";
import { previewImageUrl } from "@/lib/cloudinary";
import { adminListAchievements } from "@/lib/content";

async function Achievements() {
  const rows = await adminListAchievements();
  return (
    <AchievementsManager
      items={rows.map((r) => ({
        id: r.id,
        year: r.year,
        title: r.title,
        detail: r.detail,
        link: r.link,
        link_site: r.link_site ?? "",
        link_title: r.link_title ?? "",
        link_description: r.link_description ?? "",
        image_id: r.link_image ?? "",
        image_url: r.link_image ? previewImageUrl(r.link_image) : "",
      }))}
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
