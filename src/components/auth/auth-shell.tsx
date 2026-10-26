import Link from "next/link";
import { site } from "@/config/site";
import { getHeroImages } from "@/lib/hero-images";

// The frame for the sign-in, sign-up and password pages: his portrait on one side,
// the form on the other.
export function AuthShell({
  kicker,
  title,
  intro,
  switchTo,
  children,
}: {
  kicker: string;
  title: string;
  intro?: string;
  switchTo?: { text: string; href: string; label: string };
  children: React.ReactNode;
}) {
  const portrait = getHeroImages()[0];
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait} alt="" draggable={false} />
        ) : (
          <span className="auth-art-empty" />
        )}
        <div className="auth-art-caption">
          <span className="frame-no">{site.name}</span>
          <p className="serif">{site.tagline}</p>
        </div>
      </aside>
      <section className="auth-main">
        <div className="auth-panel">
          <header className="auth-head">
            <span className="kicker">{kicker}</span>
            <h1 className="display">{title}</h1>
            {intro && <p>{intro}</p>}
          </header>
          {children}
          {switchTo && (
            <p className="auth-switch">
              {switchTo.text}{" "}
              <Link href={switchTo.href} className="arrow-link">
                {switchTo.label}
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
