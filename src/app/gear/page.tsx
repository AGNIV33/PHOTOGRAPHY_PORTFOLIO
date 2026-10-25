import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "Gear" };

export default function GearPage() {
  return (
    <div className="wrap">
      <PageHead index="05" title="Gear" intro="The cameras and lenses behind the photographs." />
      <EmptyState title="No gear listed yet." body="Cameras and lenses added in the admin dashboard will appear here." />
    </div>
  );
}
