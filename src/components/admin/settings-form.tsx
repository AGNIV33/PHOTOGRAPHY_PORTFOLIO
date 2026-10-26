"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/content-actions";
import type { Settings } from "@/lib/content";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const field = (name: keyof Settings) => ({
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [name]: e.target.value }),
  });

  return (
    <form
      className="grid gap-8 max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await saveSettings(values);
            setError("");
            setMsg("Saved. The website shows the new details now.");
            router.refresh();
          } catch (err) {
            setMsg("");
            setError(err instanceof Error ? err.message : "Something went wrong");
          }
        });
      }}
    >
      <section className="admin-panel grid gap-4">
        <span className="kicker">About page</span>
        <label className="grid gap-1.5">
          <span className="label">About you</span>
          <textarea className="field post-body-field" rows={12} {...field("about")} placeholder="I started photographing the streets of Kolkata in…" />
          <span className="text-[14px] text-[var(--ink-2)]">Leave an empty line between paragraphs.</span>
        </label>
        <label className="grid gap-1.5 max-w-sm">
          <span className="label">City</span>
          <input className="field" {...field("city")} placeholder="Kolkata" />
        </label>
      </section>

      <section className="admin-panel grid gap-4">
        <span className="kicker">Contact and links</span>
        <label className="grid gap-1.5">
          <span className="label">Email shown on the Contact page</span>
          <input className="field" type="email" {...field("email")} placeholder="name@example.com" />
        </label>
        <label className="grid gap-1.5">
          <span className="label">Instagram link</span>
          <input className="field" {...field("instagram")} placeholder="https://www.instagram.com/yourname" />
        </label>
        <label className="grid gap-1.5">
          <span className="label">WhatsApp</span>
          <input className="field" {...field("whatsapp")} placeholder="https://wa.me/919876543210 or just the number: +91 98765 43210" />
        </label>
        <label className="grid gap-1.5">
          <span className="label">Facebook link</span>
          <input className="field" {...field("facebook")} placeholder="https://www.facebook.com/yourname" />
        </label>
        <span className="text-[14px] text-[var(--ink-2)]">Until a link is added, its icon in the website footer stays greyed out. WhatsApp is already filled in; change it here any time.</span>
      </section>

      <div className="publish-bar">
        <span className="text-[14px] mr-auto" role="status">
          {error ? <span className="text-[var(--safelight)]">{error}</span> : msg}
        </span>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
