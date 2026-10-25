import type { Metadata } from "next";
import { EmptyState, PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="wrap">
      <PageHead index="—" title="Sign in" intro="Members can see every photograph and leave likes and comments." />
      <EmptyState title="Sign-in is coming soon." body="Google and email-link sign-in will be switched on in a later step." />
    </div>
  );
}
