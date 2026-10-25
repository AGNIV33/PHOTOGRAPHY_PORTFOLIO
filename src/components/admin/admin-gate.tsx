import Link from "next/link";
import { EmptyState } from "@/components/page-head";
import { SignInForm } from "@/components/signin-form";
import { SignOutButton } from "@/components/signout-button";
import { adminState } from "@/lib/admin-guard";

// Shows the page only to the photographer. Everyone else sees why not.
export async function AdminGate({ children, next = "/admin" }: { children: React.ReactNode; next?: string }) {
  const { state, email } = await adminState();

  if (state === "not-configured") {
    return (
      <EmptyState
        title="The dashboard is waiting for its keys."
        body="Add the Supabase and Cloudinary keys to .env.local, run supabase/schema.sql once, then restart the site."
      />
    );
  }
  if (state === "signed-out") {
    return (
      <div className="grid gap-6">
        <p className="serif text-[28px] leading-tight max-w-xl">Sign in with your email to open the dashboard.</p>
        <SignInForm next={next} />
      </div>
    );
  }
  if (state === "not-admin") {
    return (
      <div className="grid gap-5 max-w-xl">
        <p className="serif text-[28px] leading-tight">
          {email} can see the website, but not the dashboard.
        </p>
        <div className="flex gap-3">
          <Link href="/" className="btn btn-primary">Go to the website</Link>
          <SignOutButton />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
