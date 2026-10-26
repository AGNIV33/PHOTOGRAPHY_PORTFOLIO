import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <AuthShell
      kicker="Join the archive"
      title="Create account"
      intro="A free account opens every photograph, and lets you like and comment."
      switchTo={{ text: "Already have an account?", href: "/signin", label: "Sign in" }}
    >
      <SignUpForm />
    </AuthShell>
  );
}
