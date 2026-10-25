import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav, AdminNavView } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="wrap pt-10">
      <header className="grid gap-3 pb-6">
        <span className="kicker">Dashboard</span>
        <Suspense fallback={<AdminNavView pathname={null} />}>
          <AdminNav />
        </Suspense>
      </header>
      {children}
    </div>
  );
}
