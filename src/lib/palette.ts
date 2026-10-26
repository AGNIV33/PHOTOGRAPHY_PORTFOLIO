import "server-only";
import { cacheLife } from "next/cache";
import sharp from "sharp";

// Picks two colours from a photograph for its caption on the home page: a bright accent for
// the title and a softer tint for the lines and labels. The colours come from the photo's
// most vivid, most common hue, then are lifted to a lightness that reads clearly on the dark
// page. Black and white photographs get a soft silver instead.
// It works on a tiny 48px copy, once per photo; the result is cached.

export type Palette = { accent: string; tint: string };

const SILVER: Palette = { accent: "#ebe8e1", tint: "#aeaaa2" };

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function toHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Cached, and throws when the picture can't be read, so a failure is never remembered.
async function loadPalette(url: string): Promise<Palette> {
  "use cache";
  cacheLife("days");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Picture not available (${res.status})`);
  const input = Buffer.from(await res.arrayBuffer());
  const { data } = await sharp(input).resize(32, 32, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

  // Twelve hue families; each pixel counts for more the more colourful it is.
  const buckets = Array.from({ length: 12 }, () => ({ w: 0, hx: 0, hy: 0, s: 0 }));
  let total = 0;
  for (let i = 0; i + 2 < data.length; i += 3) {
    const [h, s, l] = toHsl(data[i], data[i + 1], data[i + 2]);
    if (s < 0.2 || l < 0.1 || l > 0.93) continue; // greys, near-black and near-white say nothing
    const w = s * (1 - Math.abs(2 * l - 1) * 0.6);
    const b = buckets[Math.floor(h / 30) % 12];
    b.w += w;
    b.hx += Math.cos((h * Math.PI) / 180) * w;
    b.hy += Math.sin((h * Math.PI) / 180) * w;
    b.s += s * w;
    total += w;
  }
  const pixels = data.length / 3;
  // Too little colour (a black and white photograph): soft silver.
  if (total < pixels * 0.05) return SILVER;

  const best = buckets.reduce((a, b) => (b.w > a.w ? b : a));
  const hue = ((Math.atan2(best.hy, best.hx) * 180) / Math.PI + 360) % 360;
  const sat = best.s / best.w;
  return {
    accent: toHex(hue, clamp(sat * 1.1, 0.5, 0.88), 0.68),
    tint: toHex(hue, clamp(sat * 0.5, 0.18, 0.4), 0.8),
  };
}

export async function getPalette(url: string | null): Promise<Palette> {
  if (!url) return SILVER;
  try {
    return await loadPalette(url);
  } catch {
    return SILVER;
  }
}
