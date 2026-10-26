"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ADMIN_EMAILS } from "@/config/admins";
import { createClient } from "@/lib/supabase/browser";

// Who is signed in, read from the browser's session and kept in step with sign-in and
// sign-out. Only for display: the dashboard itself checks the admin on the server.
export function useSignedInUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function accountNames(user: User) {
  const meta = user.user_metadata as { first_name?: string; last_name?: string } | undefined;
  const first = meta?.first_name?.trim() || (user.email ?? "").split("@")[0];
  const last = meta?.last_name?.trim() || "";
  const initials = ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "•";
  const admin = Boolean(user.email && (ADMIN_EMAILS as readonly string[]).includes(user.email.toLowerCase()));
  return { first, full: [first, last].filter(Boolean).join(" "), initials, admin };
}

export function useLogOut() {
  const router = useRouter();
  return async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };
}

export function AccountMenu() {
  const { user, ready } = useSignedInUser();
  const logOut = useLogOut();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) return <span className="account-slot" aria-hidden="true" />;

  if (!user) {
    return (
      <Link href="/signin" className="account-signin">
        Sign in
      </Link>
    );
  }

  const names = accountNames(user);

  return (
    <div className="account" ref={root}>
      <button
        type="button"
        className="account-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={`Signed in as ${names.full}`}
      >
        <span className="avatar" data-admin={names.admin ? "" : undefined} aria-hidden="true">
          {names.initials}
        </span>
        <span className="account-name">{names.first}</span>
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-who">
            <span className="avatar avatar-lg" data-admin={names.admin ? "" : undefined} aria-hidden="true">
              {names.initials}
            </span>
            <span className="grid min-w-0">
              <span className="account-full">{names.full}</span>
              <span className="account-email">{user.email}</span>
              {names.admin && <span className="frame-no">Admin</span>}
            </span>
          </div>
          {names.admin && (
            <Link href="/admin" role="menuitem" className="account-item" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          )}
          <Link href="/gallery" role="menuitem" className="account-item" onClick={() => setOpen(false)}>
            All photos
          </Link>
          <button
            type="button"
            role="menuitem"
            className="account-item account-logout"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setOpen(false);
              await logOut();
              setBusy(false);
            }}
          >
            {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
