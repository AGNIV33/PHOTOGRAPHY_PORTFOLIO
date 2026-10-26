"use client";

import emailjs from "@emailjs/browser";
import { useEffect, useRef, useState } from "react";
import { clean, emailjsConfig, emailjsReady, LIMITS, SUBJECTS, validateContact, type ContactField, type ContactValues } from "@/lib/contact";
import { Field, FormMessage, SelectField, TextAreaField } from "./auth/fields";

// Sends a message through EmailJS. The email address that receives it is set in the EmailJS
// dashboard, never in this code. Protection against junk: a hidden field that only robots fill in,
// a minimum time on the page, a short wait between messages and a small limit per hour.

const BLANK: ContactValues = { name: "", email: "", subject: "", message: "" };
const MIN_WAIT_MS = 30_000; // between two messages from one browser
const PER_HOUR = 3; // messages per hour from one browser
const MIN_TIME_ON_PAGE_MS = 3_000; // a person needs longer than this to write a message
const STORAGE_KEY = "contact-sent";

function recentSends(): number[] {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as number[];
    return list.filter((t) => Date.now() - t < 3_600_000);
  } catch {
    return [];
  }
}

function rememberSend() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...recentSends(), Date.now()]));
  } catch {}
}

// "26 October 2026 at 9:03 pm (India time)", whatever time zone the visitor is in.
function readableTime() {
  const text = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date());
  return `${text} (India time)`;
}

function friendlyError(e: unknown) {
  const status = typeof e === "object" && e !== null && "status" in e ? Number((e as { status: unknown }).status) : 0;
  if (status === 429) return "Too many messages at once. Please wait a minute and try again.";
  if (status === 0) return "The message could not be sent. Please check your internet connection and try again.";
  return "The message could not be sent right now. Please try again later, or write to me directly by email.";
}

export function ContactForm({ directEmail }: { directEmail: string }) {
  const [v, setV] = useState<ContactValues>(BLANK);
  // Robots tick this; people never see it. It is a tick box on purpose: browsers and password
  // managers auto-fill text boxes named like "company" or "website", but they never tick boxes.
  const [honey, setHoney] = useState(false);
  const [error, setError] = useState<{ field?: ContactField; text: string } | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const set = (k: ContactField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setV({ ...v, [k]: e.target.value });
    if (error?.field === k) setError(null);
  };
  const fieldError = (k: ContactField) => (error?.field === k ? error.text : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;

    // Robots: act as if it worked, send nothing.
    if (honey || Date.now() - openedAt.current < MIN_TIME_ON_PAGE_MS) {
      console.warn("Contact form: looked like a robot, nothing was sent");
      setState("sent");
      return;
    }

    const problem = validateContact(v);
    if (problem) return setError(problem);

    const sends = recentSends();
    if (sends.length >= PER_HOUR) {
      return setError({ text: "You have sent a few messages already. Please try again in a while, or write to me directly by email." });
    }
    if (sends.length && Date.now() - sends[sends.length - 1] < MIN_WAIT_MS) {
      return setError({ text: "Please wait a moment before sending another message." });
    }

    setError(null);
    setState("sending");
    try {
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        // These names must match the {{...}} placeholders in the EmailJS template.
        {
          name: clean(v.name),
          email: clean(v.email),
          subject: v.subject,
          message: clean(v.message, true),
          time: readableTime(),
        },
        { publicKey: emailjsConfig.publicKey, blockHeadless: true, limitRate: { id: "contact-form", throttle: 15_000 } },
      );
      rememberSend();
      setState("sent");
      setV(BLANK);
    } catch (err) {
      console.warn("Contact form: sending failed", err);
      setState("idle");
      setError({ text: friendlyError(err) });
    }
  }

  if (!emailjsReady) {
    return (
      <div className="contact-card">
        <span className="kicker">Message</span>
        <p className="serif contact-card-title">The message form is not switched on yet.</p>
        {directEmail ? (
          <p className="text-[var(--ink-2)]">
            Meanwhile, please write to <a className="arrow-link" href={`mailto:${directEmail}`}>{directEmail}</a>.
          </p>
        ) : (
          <p className="text-[var(--ink-2)]">Please check back soon.</p>
        )}
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div className="contact-card" role="status">
        <span className="kicker">Message sent</span>
        <p className="serif contact-card-title">Thank you. I will write back soon.</p>
        <p className="text-[var(--ink-2)]">Your message has been sent. If you do not hear back in a few days, please check your spam folder.</p>
        <div>
          <button type="button" className="btn btn-ghost" onClick={() => setState("idle")}>
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="auth-form contact-form" noValidate>
      {error && !error.field && <FormMessage tone="error">{error.text}</FormMessage>}

      <div className="auth-grid">
        <Field label="Your name" required autoComplete="name" maxLength={LIMITS.name} value={v.name} onChange={set("name")} error={fieldError("name")} />
        <Field label="Your email" required type="email" inputMode="email" autoComplete="email" maxLength={LIMITS.email} value={v.email} onChange={set("email")} error={fieldError("email")} placeholder="you@example.com" />
      </div>

      <SelectField label="What is it about?" required options={SUBJECTS} placeholder="Choose a topic" value={v.subject} onChange={set("subject")} error={fieldError("subject")} />

      <TextAreaField
        label="Your message"
        required
        rows={7}
        maxLength={LIMITS.message}
        value={v.message}
        onChange={set("message")}
        error={fieldError("message")}
        hint={`${v.message.length} / ${LIMITS.message}`}
      />

      {/* A trap for robots. People cannot see it or reach it with the keyboard. */}
      <div className="contact-trap" aria-hidden="true">
        <label>
          Leave this unticked
          <input type="checkbox" name="contact_robot_check" tabIndex={-1} autoComplete="off" checked={honey} onChange={(e) => setHoney(e.target.checked)} />
        </label>
      </div>

      <div className="auth-row">
        <button type="submit" className="btn btn-primary auth-submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
      <p className="auth-note">Your message goes straight to my inbox. I only use your email to reply.</p>
    </form>
  );
}
