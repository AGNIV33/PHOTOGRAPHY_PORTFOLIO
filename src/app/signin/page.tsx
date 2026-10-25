import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState, PageHead } from "@/components/page-head";
import { SignInForm } from "@/components/signin-form";
import { SignOutButton } from "@/components/signout-button";
import { getUser, isAdminEmail } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

async function SignInBody({ searchParams }: { searchParams: PageProps<"/signin">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/gallery";
  const linkError = params.error === "link";

  if (!isSupabaseConfigured) {
    return (
      <EmptyState
        title="Sign-in is not switched on yet."
        body="It starts working once the Supabase keys are added."
      />
    );
  }

  const user = await getUser();
  if (user) {
    return (
      <div className="grid gap-5 max-w-md">
        <p className="serif text-[28px] leading-tight">You are signed in as {user.email}.</p>
        <div className="flex flex-wrap gap-3">
          <Link href={isAdminEmail(user.email) ? "/admin" : "/gallery"} className="btn btn-primary">
            {isAdminEmail(user.email) ? "Open dashboard" : "See all photos"}
          </Link>
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {linkError && (
        <p className="text-[var(--safelight)]" role="alert">
          That sign-in link has expired or was already used. Please ask for a new one.
        </p>
      )}
      <SignInForm next={next} />
    </div>
  );
}

export default function SignInPage(props: PageProps<"/signin">) {
  return (
    <div className="wrap">
      <PageHead
        index="—"
        title="Sign in"
        intro="Members can see every photograph and leave likes and comments."
      />
      <Suspense fallback={<p className="label">Loading…</p>}>
        <SignInBody searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
