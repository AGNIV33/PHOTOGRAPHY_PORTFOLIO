import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FinishSignIn } from "@/components/finish-sign-in";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function FinishPage() {
  return (
    <AuthShell kicker="Account" title="Almost done">
      <Suspense fallback={<p className="label">One moment…</p>}>
        <FinishSignIn />
      </Suspense>
    </AuthShell>
  );
}
