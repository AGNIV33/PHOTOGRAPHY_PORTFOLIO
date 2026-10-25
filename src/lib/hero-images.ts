import fs from "node:fs";
import path from "node:path";

// Hero slides are plain files: public/hero/hero-1.jpg, hero-2.jpg, hero-3.jpg (.jpg, .jpeg, .png or .webp).
// Slide 1 is the portrait. Missing files are skipped; if none exist the hero shows a placeholder.
const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const HERO_SLOTS = 3;

export function getHeroImages(): string[] {
  const dir = path.join(process.cwd(), "public", "hero");
  const found: string[] = [];
  for (let i = 1; i <= HERO_SLOTS; i++) {
    const ext = EXTENSIONS.find((e) => fs.existsSync(path.join(dir, `hero-${i}.${e}`)));
    if (ext) found.push(`/hero/hero-${i}.${ext}`);
  }
  return found;
}
