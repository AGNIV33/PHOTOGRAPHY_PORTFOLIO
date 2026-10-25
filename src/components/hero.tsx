"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/config/site";

const pad = (n: number) => String(n).padStart(2, "0");

export function Hero({ images, slots }: { images: string[]; slots: number }) {
  const [active, setActive] = useState(0);
  const count = images.length;
  // The counter always shows the full series length from the design (01 —— 03).
  const total = Math.max(count, slots);

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const [first, ...rest] = site.name.split(" ");

  return (
    <section className="hero" aria-label="Introduction">
      <div className="hero-media" onContextMenu={(e) => e.preventDefault()}>
        {count === 0 ? (
          <div className="hero-placeholder">
            <span className="label">
              Portrait goes here
              <br />
              Drop a photo into public/hero
            </span>
          </div>
        ) : (
          images.map((src, i) => (
            <div key={src} className="hero-slide" data-active={i === active ? "" : undefined}>
              <Image
                src={src}
                alt={i === 0 ? `Portrait of ${site.name}` : ""}
                fill
                priority={i === 0}
                sizes="(min-width: 900px) 80vw, 100vw"
                draggable={false}
              />
            </div>
          ))
        )}
      </div>

      <div className="wrap hero-content">
        <span className="kicker">{site.kicker}</span>
        <h1 className="display hero-name">
          <span>{first}</span>
          <span>{rest.join(" ")}</span>
        </h1>
        <span className="wide-caps hero-role">{site.role}</span>
        <p className="serif hero-tagline">{site.tagline}</p>
        <Link href="/gallery" className="explore">
          Explore work
          <span className="circle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9h13M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="hero-foot">
        <div className="wrap">
          <div className="slides" aria-label="Slides">
            <span className="current">{pad(active + 1)}</span>
            <button
              type="button"
              aria-label="Next slide"
              disabled={count < 2}
              onClick={() => setActive((i) => (i + 1) % count)}
            >
              <span className="track" style={{ display: "block" }}>
                <i style={{ transform: `scaleX(${(active + 1) / total})` }} />
              </span>
            </button>
            <span>{pad(total)}</span>
          </div>
          <span className="scroll-cue" aria-hidden="true">
            SCROLL
          </span>
        </div>
      </div>
    </section>
  );
}
