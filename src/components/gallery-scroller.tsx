"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Palette } from "@/lib/palette";
import type { PhotoView } from "@/lib/photos";
import { ProtectedImage } from "./protected-image";

// The home page gallery, with the motion of the reference site.
// On a laptop the section is pinned while you scroll. The photographs, in their own shapes,
// lie along a line rising to the right, tilted back in 3D and getting bigger towards the top
// right, with an even gap between them. Scrolling slides the row down and to the left one
// photograph at a time, each turning a little as it moves, and the panel on the left shows the
// one in focus. At the end the row simply runs out.
// Motion is smoothed twice: Lenis smooths the page scroll, and the row then glides towards the
// scroll position a few percent per frame, so it never jumps. The hover lift glides too.
// On phones it is the same animation, tuned for a tall narrow screen. For people who turned
// animations off it is a row to swipe instead; that switch is done in CSS.

const TILT_X = [22, 18, 26, 20, 24, 16, 23]; // how far each photograph leans back (degrees)
const TILT_Y = [-16, -10, -20, -12, -18, -8, -14]; // and turns towards the viewer
const TILT_Z = [-5, 4, -3, 6, -4, 3, -6]; // and its own small sideways turn
const GROW = Math.log(1.24); // each photograph up the line is 24% bigger than the one before
const ANGLE = (20 * Math.PI) / 180; // slope of the line
const GAP = 0.16; // clear space between neighbours, as a share of their width
const HOLD = 0.18; // share of each step where the row rests on a photograph
const HOVER_DELAY = 1000; // the pointer must rest on a photograph this long (ms) before it comes forward
const GLIDE = 0.09; // share of the remaining distance covered each frame (smaller = smoother, more lag)
// Spacing along the line so that, at every resting point, neighbours are exactly one gap apart
// whatever their size: centre distance = (half width + half width) x (1 + gap).
const spacingFor = (grow: number, gap: number) =>
  (grow * (1 + Math.exp(grow)) * (1 + gap)) / (2 * (Math.exp(grow) - 1));

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

export function GalleryScroller({ photos, palettes }: { photos: PhotoView[]; palettes: Palette[] }) {
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

    let target = 0; // where the scroll says the row should be (0 to 1)
    let current = -1; // where the row is drawn now, catching up with the target
    let frame = 0;
    let hovered = -1; // the photograph the pointer has rested on
    const lift = photos.map(() => 0); // 0 = tilted in the row, 1 = straight and in front
    let hoverTimer: number | undefined;

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
      // The caption takes on the colours of its photograph.
      const pal = palettes?.[i];
      if (pal && panelRef.current) {
        panelRef.current.style.setProperty("--gs-accent", pal.accent);
        panelRef.current.style.setProperty("--gs-tint", pal.tint);
      }
      itemRefs.current.forEach((el, k) => el?.toggleAttribute("data-focus", k === i));
      const panel = panelRef.current;
      if (panel) {
        panel.classList.remove("gs-swap");
        void panel.offsetWidth; // restart the fade
        panel.classList.add("gs-swap");
      }
    };

    // Draws the whole row for a scroll position p (0 to 1), with each photograph's hover lift.
    const draw = (p: number) => {
      if (reduced.matches) {
        itemRefs.current.forEach((el) => el && (el.style.transform = ""));
        return;
      }
      const mobile = narrow.matches;
      const grow = mobile ? Math.log(1.16) : GROW;
      const gap = mobile ? 0.12 : GAP;
      const slope = mobile ? Math.tan((38 * Math.PI) / 180) : Math.tan(ANGLE);
      const spacing = spacingFor(grow, gap);
      // Each photograph's width comes from the CSS, so the spacing follows it exactly.
      const D = itemRefs.current[0]?.offsetWidth || 320;
      const W = st.clientWidth;
      const H = st.clientHeight;
      const lean = mobile ? 0.6 : 1; // 3D tilt is gentler on a phone

      // Scroll position in photographs, resting briefly on each one.
      const q = p * (total - 1);
      const k = Math.floor(q);
      const shift = Math.min(total - 1, k + easeInOut(Math.min(1, Math.max(0, (q - k - HOLD / 2) / (1 - HOLD)))));

      // Where the photograph in focus sits. Laptop: right of centre, and for the very last
      // photograph a little closer to the middle. Phone: the middle.
      const lastBlend = Math.min(1, Math.max(0, shift - (total - 2)));
      const fx = mobile ? 0 : W * (0.14 - 0.08 * lastBlend);

      // Height of the focus point: the photograph just before the focused one sits below and to
      // the left, so lift or lower the row to keep that one clear of the caption above it and
      // fully on screen below it. (This is what stops photographs overlapping the caption.)
      const panel = panelRef.current;
      const panelBottom = panel ? panel.offsetTop + panel.offsetHeight : 0;
      // Its height on screen: the tallest photograph's height plus what the sideways tilt adds.
      const tallest = Math.max(...itemRefs.current.map((el) => el?.offsetHeight ?? 0), D * 0.5);
      const prevHeight = (tallest + 0.22 * D) * Math.exp(-grow);
      const prevDrop = Math.abs(((D * spacing) / grow) * (Math.exp(-grow) - 1)) * slope; // how far below the focus point it sits
      const fyMin = panelBottom + 14 + prevHeight / 2 - H / 2 - prevDrop;
      const fyMax = H / 2 - 14 - prevHeight / 2 - prevDrop;
      const fyWanted = mobile ? H * 0.14 : -H * 0.14;
      // If there isn't room for both (a short window), share the shortfall between top and bottom.
      const fy = fyMin <= fyMax ? Math.min(Math.max(fyWanted, fyMin), fyMax) : (fyMin + fyMax) / 2;

      let nearest = 0;
      let best = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = i - shift; // 0 = in focus, positive = further up the line
        const size = Math.exp(grow * t);
        // Horizontal distance from the focus point (see spacingFor).
        const along = ((D * spacing) / grow) * (Math.exp(grow * t) - 1);
        const x = fx + along;
        const y = fy - along * slope;
        // Each one turns a little as it travels; a lifted photograph straightens to face you.
        const l = lift[i];
        const rz = (TILT_Z[i % TILT_Z.length] + t * 4) * lean * (1 - l);
        const ry = (TILT_Y[i % TILT_Y.length] + t * 3) * lean * (1 - l);
        const rx = TILT_X[i % TILT_X.length] * lean * (1 - l);
        const s = size * (1 + 0.08 * l);
        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(4)})`;
        // Bigger photographs (further up the line) sit in front; a lifted one comes to the very front.
        el.style.zIndex = String(l > 0.5 ? 190 : 50 + Math.round(t * 10));
        el.style.opacity = size < 0.3 ? "0" : "1";
        if (Math.abs(t) < best) {
          best = Math.abs(t);
          nearest = i;
        }
      });

      // Safety net for very short windows where the row can't fit above and below the caption:
      // a photograph that really sits over the caption fades out. Measured after the move.
      if (panel) {
        const pr = panel.getBoundingClientRect();
        itemRefs.current.forEach((el) => {
          if (!el || el.style.opacity === "0") return;
          const r = el.getBoundingClientRect();
          const overW = Math.min(r.right, pr.right + 8) - Math.max(r.left, pr.left - 8);
          const overH = Math.min(r.bottom, pr.bottom + 8) - Math.max(r.top, pr.top - 8);
          if (overW > 70 && overH > 70) el.style.opacity = "0";
        });
      }
      setFocus(nearest);
    };

    // Glides the row and the hover lifts towards their targets, a few percent per frame.
    const glide = () => {
      current += (target - current) * GLIDE;
      if (Math.abs(target - current) < 0.0005) current = target;
      let moving = current !== target;
      for (let i = 0; i < lift.length; i++) {
        const goal = i === hovered ? 1 : 0;
        lift[i] += (goal - lift[i]) * GLIDE * 1.4;
        if (Math.abs(goal - lift[i]) < 0.002) lift[i] = goal;
        else moving = true;
      }
      draw(current);
      frame = moving ? requestAnimationFrame(glide) : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(glide);
    };

    // Reads the scroll position of the section and starts the glide towards it.
    const measure = () => {
      const rect = sec.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      target = Math.min(1, Math.max(0, -rect.top / scrollable));
      if (current < 0) current = target; // first time: start where we are, no glide from nothing
      kick();
    };

    // A small "View" label follows the pointer over a photograph.
    const onMove = (e: PointerEvent) => {
      const c = cursorRef.current;
      if (!c) return;
      const overPhoto = (e.target as Element | null)?.closest?.(".gs-item");
      c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      c.toggleAttribute("data-on", Boolean(overPhoto));
    };
    const onLeave = () => cursorRef.current?.removeAttribute("data-on");

    // Only a mouse resting on a photograph for a while brings it forward; touch never does.
    const els = [...itemRefs.current];
    const enters = els.map((_, i) => (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => {
        hovered = i;
        kick();
      }, HOVER_DELAY);
    });
    const leaves = els.map((_, i) => () => {
      window.clearTimeout(hoverTimer);
      if (hovered === i) {
        hovered = -1;
        kick();
      }
    });
    els.forEach((el, i) => {
      el?.addEventListener("pointerenter", enters[i]);
      el?.addEventListener("pointerleave", leaves[i]);
    });

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    reduced.addEventListener("change", measure);
    narrow.addEventListener("change", measure);
    st.addEventListener("pointermove", onMove);
    st.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(hoverTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      reduced.removeEventListener("change", measure);
      narrow.removeEventListener("change", measure);
      st.removeEventListener("pointermove", onMove);
      st.removeEventListener("pointerleave", onLeave);
      els.forEach((el, i) => {
        el?.removeEventListener("pointerenter", enters[i]);
        el?.removeEventListener("pointerleave", leaves[i]);
      });
    };
  }, [photos, palettes, total]);

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
              <span className="gs-cap">
                <span>{photo.caption || "Untitled"}</span>
                <span className="frame-no">{pad(i + 1)}</span>
              </span>
            </Link>
          ))}
        </div>

        <div
          ref={panelRef}
          className="gs-info"
          style={{ "--gs-accent": palettes[0]?.accent, "--gs-tint": palettes[0]?.tint } as React.CSSProperties}
        >
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
