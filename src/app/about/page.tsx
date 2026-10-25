import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="wrap">
      <PageHead index="06" title="About" intro="A short introduction to the photographer." />
      <EmptyState title="About text needed." body="The photographer's story and portrait go here." />
    </div>
  );
}
