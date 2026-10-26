"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

// A camera iris that covers the page while it loads. The website shows through its opening.
//
// - Home page load/reload, and right after signing in: the full welcome. The blades open
//   as the page really loads, a number counts to 100, then the iris opens wide.
// - Any other page load/reload: the same, shorter.
// - Moving between pages: the iris closes quickly, then opens on the new page. No number.
//
// It never traps the visitor: the page underneath is already in place, every sequence has a
// time limit, and a CSS timer hides the cover after 10 seconds even if scripts fail.

const N = 8; // blades
const RING = 44; // outer ring radius (drawing units; the drawing is 200 wide)
const R_MIN = 1.2; // almost shut
const R_LOAD = 33; // how far it opens while loading

const WELCOME_MIN = 2400;
const SHORT_MIN = 800;
const HOLD = 160;
const WELCOME_BLOW = 780;
const SHORT_BLOW = 480;
const NAV_CLOSE = 260;
const NAV_OPEN = 520;
const LOAD_LIMIT = 7000;
// Whatever happens, the cover is removed after this long (a timer, so it works even if
// the browser pauses animation frames).
const COVER_LIMIT = 12000;
const NAV_LIMIT = 5000;
const WELCOME_KEY = "iris-welcome";

// Call right before moving to a new page after sign-in, so the full welcome plays there.
export function markWelcomeNext() {
  try {
    sessionStorage.setItem(WELCOME_KEY, "1");
  } catch {}
}

function takeWelcomeFlag() {
  try {
    const on = sessionStorage.getItem(WELCOME_KEY) === "1";
    if (on) sessionStorage.removeItem(WELCOME_KEY);
    return on;
  } catch {
    return false;
  }
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const rotationFor = (R: number) => -0.3 + 0.012 * R;

function vertices(R: number, rot: number) {
  return Array.from({ length: N }, (_, k) => {
    const a = rot + (2 * Math.PI * k) / N;
    return [R * Math.cos(a), R * Math.sin(a)] as const;
  });
}

function pointsAttr(R: number, rot: number) {
  return vertices(R, rot)
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

// Each blade edge continues past its corner out to the ring, which gives the pinwheel look.
function bladeLine(R: number, rot: number, k: number) {
  if (R >= RING - 0.5) return null;
  const v = vertices(R, rot);
  const a = v[k];
  const b = v[(k + 1) % N];
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  const bb = b[0] * dx + b[1] * dy;
  const disc = bb * bb - (b[0] * b[0] + b[1] * b[1] - RING * RING);
  if (disc < 0) return null;
  const t = -bb + Math.sqrt(disc);
  return { x1: a[0], y1: a[1], x2: b[0] + dx * t, y2: b[1] + dy * t };
}

type Refs = {
  root?: React.Ref<HTMLDivElement>;
  hole?: React.Ref<SVGPolygonElement>;
  outline?: React.Ref<SVGPolygonElement>;
  chrome?: React.Ref<SVGGElement>;
  label?: React.Ref<SVGTextElement>;
  digits?: React.Ref<SVGTSpanElement>;
  line?: (k: number) => React.Ref<SVGLineElement>;
};

// The markup alone. Also the stand-in the server sends, so the cover is there from the
// very first paint and the page never flashes before the loader starts.
export function IrisView({ root, hole, outline, chrome, label, digits, line }: Refs) {
  const rot = rotationFor(R_MIN);
  return (
    <div ref={root} className="iris-loader" data-on="1" role="status" aria-label="Loading">
      <span className="sr-only">Loading the website…</span>
      <svg className="iris-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
        <defs>
          <mask id="iris-hole" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="8000" height="8000">
            <rect x="-4000" y="-4000" width="8000" height="8000" fill="#fff" />
            <polygon ref={hole} points={pointsAttr(R_MIN, rot)} fill="#000" />
          </mask>
        </defs>
        <rect x="-4000" y="-4000" width="8000" height="8000" className="iris-cover" mask="url(#iris-hole)" />
        <g ref={chrome}>
          <circle r={RING} className="iris-ring" />
          <circle r={RING + 2.4} className="iris-ring iris-ring-2" />
          {Array.from({ length: N }, (_, k) => {
            const l = bladeLine(R_MIN, rot, k);
            return <line key={k} ref={line?.(k)} className="iris-blade" {...(l ?? {})} />;
          })}
        </g>
        <polygon ref={outline} points={pointsAttr(R_MIN, rot)} className="iris-edge" />
        <text ref={label} x="0" y={RING + 18} textAnchor="middle" className="iris-num">
          <tspan ref={digits}>0</tspan>
          <tspan className="iris-pct" dx="1">
            %
          </tspan>
        </text>
      </svg>
    </div>
  );
}

export function IrisLoader() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const hole = useRef<SVGPolygonElement>(null);
  const outline = useRef<SVGPolygonElement>(null);
  const chrome = useRef<SVGGElement>(null);
  const label = useRef<SVGTextElement>(null);
  const digits = useRef<SVGTSpanElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);

  const token = useRef(0);
  const curR = useRef(R_MIN);
  const prevPath = useRef<string | null>(null);
  const initialPath = useRef(pathname);
  const navPending = useRef(false);
  const navTimer = useRef<number | undefined>(undefined);
  const fontsReady = useRef(false);
  const reduced = useRef(false);
  const safety = useRef<number | undefined>(undefined);

  const endRadius = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const unit = Math.min(0.86 * Math.min(w, h), 520) / 200;
    return (Math.hypot(w, h) / 2 / unit / Math.cos(Math.PI / N)) * 1.06;
  };

  const draw = (R: number) => {
    curR.current = R;
    const rot = rotationFor(R);
    const pts = pointsAttr(R, rot);
    hole.current?.setAttribute("points", pts);
    outline.current?.setAttribute("points", pts);
    for (let k = 0; k < N; k++) {
      const el = lines.current[k];
      if (!el) continue;
      const l = bladeLine(R, rot, k);
      if (l) {
        el.setAttribute("x1", l.x1.toFixed(2));
        el.setAttribute("y1", l.y1.toFixed(2));
        el.setAttribute("x2", l.x2.toFixed(2));
        el.setAttribute("y2", l.y2.toFixed(2));
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    }
    if (chrome.current) chrome.current.style.opacity = String(R < RING ? 1 : Math.max(0, 1 - (R - RING) / 16));
  };

  const setNumber = (n: number, opacity = 1) => {
    if (digits.current) digits.current.textContent = String(n);
    if (label.current) label.current.style.opacity = String(opacity);
  };

  const show = () => {
    const el = root.current;
    if (!el) return;
    el.dataset.on = "1";
    el.style.animation = "none"; // scripts are alive, so the 10-second safety timer is not needed
    el.style.opacity = "";
    el.style.transition = "";
    window.clearTimeout(safety.current);
    safety.current = window.setTimeout(() => {
      token.current++; // stops any sequence still running
      hide();
    }, COVER_LIMIT);
  };

  const hide = () => {
    window.clearTimeout(safety.current);
    if (root.current) root.current.dataset.on = "0";
  };

  const tween = (id: number, ms: number, step: (t: number) => void) =>
    new Promise<boolean>((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        if (id !== token.current) return resolve(false);
        const t = ms <= 0 ? 1 : clamp01((now - start) / ms);
        step(t);
        if (t < 1) requestAnimationFrame(tick);
        else resolve(true);
      };
      requestAnimationFrame(tick);
    });

  // How far the page has really loaded: scripts running, fonts ready, everything loaded.
  const loadedPercent = () => {
    if (document.readyState === "complete") return 100;
    if (fontsReady.current) return 70;
    if (document.readyState !== "loading") return 45;
    return 20;
  };

  async function playLoad(id: number, minMs: number, blowMs: number) {
    show();
    draw(R_MIN);
    setNumber(0);
    const start = performance.now();
    let p = 0;
    const done = await new Promise<boolean>((resolve) => {
      const tick = (now: number) => {
        if (id !== token.current) return resolve(false);
        const elapsed = now - start;
        const target = elapsed > LOAD_LIMIT ? 100 : loadedPercent();
        // Never ahead of the real loading, and never faster than the animation's pace.
        const goal = Math.min(target, (elapsed / (minMs * 0.85)) * 100);
        p = Math.max(p, p + (goal - p) * 0.18);
        if (goal >= 100 && p > 99.4) p = 100;
        setNumber(Math.floor(p));
        draw(lerp(R_MIN, R_LOAD, easeOut(p / 100)));
        if (p >= 100) resolve(true);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (!done) return;
    if (!(await tween(id, HOLD, () => {}))) return;
    const R_end = endRadius();
    const ok = await tween(id, blowMs, (t) => {
      draw(lerp(R_LOAD, R_end, easeInOut(t)));
      setNumber(100, 1 - clamp01(t * 2.5));
    });
    if (ok) hide();
  }

  async function playClose(id: number) {
    show();
    setNumber(0, 0);
    const from = curR.current;
    await tween(id, NAV_CLOSE, (t) => draw(lerp(from, R_MIN, easeOut(t))));
  }

  async function playOpen(id: number) {
    show();
    setNumber(0, 0);
    const from = curR.current;
    const R_end = endRadius();
    const ok = await tween(id, NAV_OPEN, (t) => draw(lerp(from, R_end, easeInOut(t))));
    if (ok) hide();
  }

  // Calm version for people who turned animations off: a still lens, then a fade.
  async function playReduced(id: number) {
    show();
    draw(R_LOAD);
    setNumber(0);
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (id !== token.current) return resolve();
        const elapsed = now - start;
        if ((loadedPercent() >= 100 && elapsed > 400) || elapsed > LOAD_LIMIT) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (id !== token.current) return;
    setNumber(100);
    const el = root.current;
    if (!el) return;
    el.style.transition = "opacity 250ms ease";
    el.style.opacity = "0";
    window.setTimeout(() => {
      if (id === token.current) hide();
    }, 280);
  }

  // First load or reload of whatever page this is.
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.fonts?.ready.then(() => {
      fontsReady.current = true;
    });
    const id = ++token.current;
    const welcome = initialPath.current === "/" || takeWelcomeFlag();
    if (reduced.current) void playReduced(id);
    else void playLoad(id, welcome ? WELCOME_MIN : SHORT_MIN, welcome ? WELCOME_BLOW : SHORT_BLOW);
    return () => {
      // A counter, not a page element: any running sequence stops when this changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      token.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Moving to another page: set before the new page is painted.
  useLayoutEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    window.clearTimeout(navTimer.current);
    const id = ++token.current;
    const wasClosing = navPending.current;
    navPending.current = false;
    const welcome = takeWelcomeFlag();
    if (reduced.current) {
      hide();
      return;
    }
    if (!wasClosing || welcome) {
      show();
      draw(R_MIN);
    }
    if (welcome) void playLoad(id, WELCOME_MIN, WELCOME_BLOW);
    else void playOpen(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close the iris as soon as a link to another page is clicked.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (reduced.current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      navPending.current = true;
      const id = ++token.current;
      void playClose(id);
      window.clearTimeout(navTimer.current);
      // If the page never changes (a failed or cancelled move), open again.
      navTimer.current = window.setTimeout(() => {
        if (!navPending.current) return;
        navPending.current = false;
        void playOpen(++token.current);
      }, NAV_LIMIT);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <IrisView
      root={root}
      hole={hole}
      outline={outline}
      chrome={chrome}
      label={label}
      digits={digits}
      line={(k) => (el) => {
        lines.current[k] = el;
      }}
    />
  );
}
