import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <div className="wrap">
      <PageHead index="03" title="Journal" intro="Stories and notes from the street." />
      <EmptyState title="No posts yet." body="Posts written in the admin dashboard will appear here." />
    </div>
  );
}
