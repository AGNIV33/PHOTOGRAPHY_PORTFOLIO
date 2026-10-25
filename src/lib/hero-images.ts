import fs from "node:fs";
import path from "node:path";

// Hero slides are any image files dropped into public/hero (.jpg, .jpeg, .png or .webp),
// in name order, up to three. Name them 1-..., 2-... to control the order.
// If the folder has none, the hero shows a placeholder.
const IMAGE = /\.(jpe?g|png|webp)$/i;
export const HERO_SLOTS = 3;

export function getHeroImages(): string[] {
  const dir = path.join(process.cwd(), "public", "hero");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, HERO_SLOTS)
    .map((f) => `/hero/${encodeURIComponent(f)}`);
}
