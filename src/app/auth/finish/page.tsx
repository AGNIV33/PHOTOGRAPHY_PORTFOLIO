import type { Metadata } from "next";
import { Suspense } from "react";
import { FinishSignIn } from "@/components/finish-sign-in";

export const metadata: Metadata = { title: "Signing in", robots: { index: false } };

export default function FinishPage() {
  return (
    <div className="wrap pt-16">
      <Suspense fallback={<p className="label">Signing you in…</p>}>
        <FinishSignIn />
      </Suspense>
    </div>
  );
}
