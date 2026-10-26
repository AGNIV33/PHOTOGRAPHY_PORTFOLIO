import Link from "next/link";
import { EmptyState } from "@/components/page-head";
import { SignOutButton } from "@/components/signout-button";
import { adminState } from "@/lib/admin-guard";

// Shows the page only to the photographer. Everyone else sees why not.
export async function AdminGate({ children, next = "/admin" }: { children: React.ReactNode; next?: string }) {
  const { state, email } = await adminState();

  if (state === "not-configured") {
    return (
      <EmptyState
        title="The dashboard is waiting for its keys."
        body="Add the Supabase and Cloudinary keys to .env, run supabase/schema.sql once, then restart the site."
      />
    );
  }
  if (state === "signed-out") {
    return (
      <div className="grid gap-6 justify-items-start">
        <p className="serif text-[28px] leading-tight max-w-xl">Please sign in to open the dashboard.</p>
        <Link href={`/signin?next=${encodeURIComponent(next)}`} className="btn btn-primary">Sign in</Link>
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
