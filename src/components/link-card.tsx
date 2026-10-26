import type { AchievementView } from "@/lib/content";

function hostOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

// A clickable card for the page he links to. With a preview it shows that page's picture,
// title and text; without one it is still a clean card with the address.
export function LinkCard({ a }: { a: AchievementView }) {
  const site = a.link_site || hostOf(a.link);
  const title = a.link_title || `Open on ${site}`;
  return (
    <a href={a.link} target="_blank" rel="noopener noreferrer" className="link-card" data-pic={a.link_image_url ? "yes" : "no"}>
      {a.link_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.link_image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="link-card-pic" />
      )}
      <span className="link-card-body">
        <span className="label">{site}</span>
        <span className="link-card-title">{title}</span>
        {a.link_description && <span className="link-card-text">{a.link_description}</span>}
        <span className="link-card-open">
          Open <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </span>
      </span>
    </a>
  );
}
