"use client";

import { useState } from "react";
import { useLogOut } from "@/components/account-menu";

export function SignOutButton() {
  const logOut = useLogOut();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await logOut();
      }}
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
