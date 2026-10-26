import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { ListManager } from "@/components/admin/list-manager";
import { deleteGear, moveGear, saveGear } from "@/app/admin/content-actions";
import { adminListGear } from "@/lib/content";

async function Gear() {
  const rows = await adminListGear();
  return (
    <ListManager
      noun="item"
      titleField="name"
      fields={[
        { name: "kind", label: "Type", placeholder: "Camera", suggestions: ["Camera", "Lens", "Film", "Other"], width: "short" },
        { name: "name", label: "Name", placeholder: "Fujifilm X100V" },
        { name: "note", label: "A line about it (optional)", multiline: true },
      ]}
      items={rows.map((r) => ({ id: r.id, kind: r.kind, name: r.name, note: r.note }))}
      save={saveGear}
      remove={deleteGear}
      move={moveGear}
    />
  );
}

export default function GearAdminPage() {
  return (
    <Suspense fallback={<p className="label">Loading…</p>}>
      <AdminGate next="/admin/gear">
        <Gear />
      </AdminGate>
    </Suspense>
  );
}
