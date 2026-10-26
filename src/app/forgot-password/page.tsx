import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      kicker="Password"
      title="New password"
      intro="Write your email and we'll send you a link to choose a new password."
      switchTo={{ text: "Remembered it?", href: "/signin", label: "Sign in" }}
    >
      <ForgotForm />
    </AuthShell>
  );
}
