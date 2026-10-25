import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminPage() {
  return (
    <div className="wrap">
      <PageHead index="—" title="Dashboard" intro="Private area for uploading and organising photographs." />
      <EmptyState title="The dashboard is being built." body="Add photo, albums, journal and comments will live here." />
    </div>
  );
}
