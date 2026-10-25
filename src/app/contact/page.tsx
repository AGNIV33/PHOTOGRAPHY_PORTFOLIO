import type { Metadata } from "next";
import { PageHead } from "@/components/page-head";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="wrap">
      <PageHead
        index="04"
        title="Contact"
        intro="For exhibitions, features, or just to talk about a photograph."
      />
      <dl className="grid gap-8 md:grid-cols-3 max-w-4xl">
        <div className="grid gap-2">
          <dt className="label">Email</dt>
          <dd className="text-muted">Email address needed</dd>
        </div>
        {site.social.map((s) => (
          <div key={s.label} className="grid gap-2">
            <dt className="label">{s.label}</dt>
            <dd>
              {s.href ? (
                <a href={s.href} target="_blank" rel="noreferrer" className="arrow-link">
                  Open profile
                </a>
              ) : (
                <span className="text-muted">Link needed</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
