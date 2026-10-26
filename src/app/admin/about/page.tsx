import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { SettingsForm } from "@/components/admin/settings-form";
import { adminGetSettings } from "@/lib/content";

async function About() {
  return <SettingsForm initial={await adminGetSettings()} />;
}

export default function AboutAdminPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/about">
        <About />
      </AdminGate>
    </Suspense>
  );
}
