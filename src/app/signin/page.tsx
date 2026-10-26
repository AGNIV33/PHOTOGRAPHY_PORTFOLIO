import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmptyState } from "@/components/page-head";
import { SignInForm } from "@/components/signin-form";
import { SignOutButton } from "@/components/signout-button";
import { getUser, isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

async function SignInBody({ searchParams }: { searchParams: PageProps<"/signin">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";

  if (!isSupabaseConfigured) {
    return <EmptyState title="Sign-in is not switched on yet." body="It starts working once the Supabase keys are added." />;
  }

  const user = await getUser();
  if (user) {
    const admin = isAdmin(user);
    return (
      <div className="auth-sent">
        <p className="serif auth-sent-title">
          You are signed in.
          <span>{user.email}</span>
        </p>
        <div className="auth-row">
          <Link href={admin ? "/admin" : "/gallery"} className="btn btn-primary auth-submit">
            {admin ? "Open dashboard" : "See all photos"}
          </Link>
          <SignOutButton />
        </div>
      </div>
    );
  }

  return <SignInForm next={next} />;
}

export default function SignInPage(props: PageProps<"/signin">) {
  return (
    <AuthShell
      kicker="Members"
      title="Sign in"
      intro="Welcome back. Sign in to see every photograph, and to like and comment."
      switchTo={{ text: "New here?", href: "/signup", label: "Create an account" }}
    >
      <Suspense fallback={<p className="label">Loading…</p>}>
        <SignInBody searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}
