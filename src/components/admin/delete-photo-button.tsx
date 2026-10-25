"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePhoto } from "@/app/admin/actions";

export function DeletePhotoButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-[14px] text-[var(--safelight)] hover:underline disabled:opacity-50"
      disabled={pending}
      aria-label={`Delete ${label}`}
      onClick={() => {
        if (!window.confirm("Delete this photo? It will be removed from the website for good.")) return;
        start(async () => {
          await deletePhoto(id);
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
