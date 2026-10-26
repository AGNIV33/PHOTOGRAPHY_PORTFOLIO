"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PhotoView } from "@/lib/photos";
import { ProtectedImage } from "./protected-image";

// The home page gallery, with the motion of the reference site.
// On a laptop the section is pinned while you scroll. The photographs, in their own shapes,
// lie along a line rising to the right, tilted back in 3D and getting bigger towards the top
// right, with an even gap between them. Scrolling slides the row down and to the left one
// photograph at a time, each turning a little as it moves, and the panel on the left shows the
// one in focus. At the end the row simply runs out.
// On phones (and for people who turned animations off) it is a row to swipe instead; the switch
// is done in CSS, so the same images are used for both.

const TILT_X = [22, 18, 26, 20, 24, 16, 23]; // how far each photograph leans back (degrees)
const TILT_Y = [-16, -10, -20, -12, -18, -8, -14]; // and turns towards the viewer
const TILT_Z = [-5, 4, -3, 6, -4, 3, -6]; // and its own small sideways turn
const GROW = Math.log(1.24); // each photograph up the line is 24% bigger than the one before
const ANGLE = (26 * Math.PI) / 180; // slope of the line
const GAP = 0.26; // clear space between neighbours, as a share of their width
const HOLD = 0.18; // share of each step where the row rests on a photograph
// Spacing along the line so that, at every resting point, neighbours are exactly one gap apart
// whatever their size: centre distance = (half width + half width) x (1 + gap).
const SPACING = (GROW * (1 + Math.exp(GROW)) * (1 + GAP)) / (2 * (Math.exp(GROW) - 1));

const pad = (n: number) => String(n).padStart(2, "0");
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function dateOf(d: string | null) {
  if (!d) return "—";
  const [y, m] = d.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return m ? `${months[m - 1]} ${y}` : String(y);
}

function settingsOf(p: PhotoView) {
  return [p.focal_length, p.aperture, p.shutter, p.iso && `ISO ${p.iso.replace(/^ISO\s*/i, "")}`].filter(Boolean).join(" · ") || "—";
}

export function GalleryScroller({ photos }: { photos: PhotoView[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const placeRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<HTMLElement>(null);
  const settingsRef = useRef<HTMLElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const shown = useRef(-1);
  const total = photos.length;

  useEffect(() => {
    const sec = sectionRef.current;
    const st = stageRef.current;
    if (!sec || !st) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 767px)");

    const setFocus = (i: number) => {
      if (i === shown.current) return;
      shown.current = i;
      const ph = photos[i];
      if (countRef.current) countRef.current.textContent = `${pad(i + 1)} / ${pad(total)}`;
      if (titleRef.current) titleRef.current.textContent = ph.caption || "Untitled";
      if (placeRef.current) placeRef.current.textContent = ph.place || "—";
      if (dateRef.current) dateRef.current.textContent = dateOf(ph.taken_at);
      if (cameraRef.current) cameraRef.current.textContent = ph.camera || "—";
      if (settingsRef.current) settingsRef.current.textContent = settingsOf(ph);
      if (openRef.current) openRef.current.href = `/photo/${ph.id}`;
      itemRefs.current.forEach((el, k) => el?.toggleAttribute("data-focus", k === i));
      const panel = panelRef.current;
      if (panel) {
        panel.classList.remove("gs-swap");
        void panel.offsetWidth; // restart the fade
        panel.classList.add("gs-swap");
      }
    };

    const update = () => {
      if (reduced.matches || narrow.matches) {
        itemRefs.current.forEach((el) => el && (el.style.transform = ""));
        return;
      }
      const rect = sec.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / scrollable));
      // Scroll position in photographs, resting briefly on each one.
      const q = p * (total - 1);
      const k = Math.floor(q);
      const shift = Math.min(total - 1, k + easeInOut(Math.min(1, Math.max(0, (q - k - HOLD / 2) / (1 - HOLD)))));

      const W = st.clientWidth;
      const H = st.clientHeight;
      const D = Math.min(W * 0.34, 600); // width of the photograph in focus
      const fx = W * 0.14; // where the photograph in focus sits, from the centre
      const fy = H * 0.07;

      let nearest = 0;
      let best = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = i - shift; // 0 = in focus, positive = further up the line
        const size = Math.exp(GROW * t);
        // Horizontal distance from the focus point (see SPACING).
        const along = ((D * SPACING) / GROW) * (Math.exp(GROW * t) - 1);
        const x = fx + along;
        const y = fy - along * Math.tan(ANGLE);
        // Each one turns a little as it travels.
        const rz = TILT_Z[i % TILT_Z.length] + t * 4;
        const ry = TILT_Y[i % TILT_Y.length] + t * 3;
        const rx = TILT_X[i % TILT_X.length];
        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) rotateX(${rx}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${size.toFixed(4)})`;
        // Bigger photographs (further up the line) sit in front.
        el.style.zIndex = String(50 + Math.round(t * 10));
        el.style.opacity = size < 0.3 ? "0" : "1";
        if (Math.abs(t) < best) {
          best = Math.abs(t);
          nearest = i;
        }
      });
      setFocus(nearest);
    };

    // A small "View" label follows the pointer over a photograph.
    const onMove = (e: PointerEvent) => {
      const c = cursorRef.current;
      if (!c) return;
      const overDisc = (e.target as Element | null)?.closest?.(".gs-item");
      c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      c.toggleAttribute("data-on", Boolean(overDisc));
    };
    const onLeave = () => cursorRef.current?.removeAttribute("data-on");

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    reduced.addEventListener("change", update);
    narrow.addEventListener("change", update);
    st.addEventListener("pointermove", onMove);
    st.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reduced.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      st.removeEventListener("pointermove", onMove);
      st.removeEventListener("pointerleave", onLeave);
    };
  }, [photos, total]);

  const first = photos[0];

  return (
    <section ref={sectionRef} className="gs" aria-label="Recent photographs">
      <div ref={stageRef} className="gs-stage">
        <div className="gs-track">
          {photos.map((photo, i) => (
            <Link
              key={photo.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              href={`/photo/${photo.id}`}
              className="gs-item"
              aria-label={photo.caption || `Photograph ${pad(i + 1)}`}
              draggable={false}
            >
              <ProtectedImage
                src={photo.card ?? photo.thumb ?? ""}
                alt={photo.caption}
                width={photo.width}
                height={photo.height}
                priority
              />
              {/* A hand-drawn ring around the photograph on hover. */}
              <svg className="gs-scribble" viewBox="0 0 200 200" aria-hidden="true">
                <path d="M100 8c52 0 88 38 88 90 0 50-40 94-92 94C46 192 10 154 12 100 14 50 52 10 104 12c40 2 72 26 80 60" />
              </svg>
              <span className="gs-cap">
                <span>{photo.caption || "Untitled"}</span>
                <span className="frame-no">{pad(i + 1)}</span>
              </span>
            </Link>
          ))}
        </div>

        <div ref={panelRef} className="gs-info">
          <span className="gs-kicker">
            <span ref={countRef} className="frame-no">
              {pad(1)} / {pad(total)}
            </span>
            <span className="label">Recent frames</span>
          </span>
          <span ref={titleRef} className="gs-title display">
            {first?.caption || "Untitled"}
          </span>
          <dl className="gs-facts">
            <div>
              <dt className="label">Place</dt>
              <dd ref={placeRef}>{first?.place || "—"}</dd>
            </div>
            <div>
              <dt className="label">Date</dt>
              <dd ref={dateRef}>{dateOf(first?.taken_at ?? null)}</dd>
            </div>
            <div>
              <dt className="label">Camera</dt>
              <dd ref={cameraRef}>{first?.camera || "—"}</dd>
            </div>
            <div>
              <dt className="label">Settings</dt>
              <dd ref={settingsRef}>{first ? settingsOf(first) : "—"}</dd>
            </div>
          </dl>
          <Link ref={openRef} href={first ? `/photo/${first.id}` : "/gallery"} className="gs-open arrow-link">
            View photograph
          </Link>
        </div>

        <Link href="/gallery" className="gs-all explore">
          All photos
          <span className="circle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9h13M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
        </Link>
        <span ref={cursorRef} className="gs-cursor" aria-hidden="true">
          View
        </span>
      </div>
    </section>
  );
}
