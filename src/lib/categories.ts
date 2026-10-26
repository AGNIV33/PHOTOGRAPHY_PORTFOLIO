// Categories (tags) for photographs, and the place shown in the Work page filter.
// Safe to use in the browser and on the server.

export const BW = "Black & white";
export const COLOUR = "Colour";

// Style categories the AI chooses from. Any other name can be added by hand.
export const STYLE_TAGS = [
  "Street",
  "Portrait",
  "Landscape",
  "Nature",
  "Wildlife",
  "Architecture",
  "People",
  "Festival",
  "Culture",
  "Documentary",
  "Night",
  "Travel",
  "Water",
  "Religion",
  "Abstract",
] as const;

export const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 30;

const KNOWN = [BW, COLOUR, ...STYLE_TAGS];

// One tidy spelling per category: "street", " Street " and "STREET" all become "Street".
export function canonicalTag(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH).trim();
  if (!text) return "";
  const known = KNOWN.find((k) => k.toLowerCase() === text.toLowerCase());
  if (known) return known;
  if (/^black\s*(and|&)\s*white$|^b\s*&\s*w$|^b\/w$|^monochrome$/i.test(text)) return BW;
  if (/^colou?r(ed|ful)?$/i.test(text)) return COLOUR;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function cleanTags(input: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input ?? []) {
    const tag = canonicalTag(String(raw));
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

// A photo is either black and white or colour, never both.
export function withColourTag(tags: readonly string[], colour: typeof BW | typeof COLOUR): string[] {
  return cleanTags([colour, ...tags.filter((t) => t !== BW && t !== COLOUR)]);
}

export function hasColourTag(tags: readonly string[]) {
  return tags.includes(BW) || tags.includes(COLOUR);
}

// "Esplanade, Kolkata" -> "Kolkata"; "Ranaghat,West Bengal,India" -> "West Bengal"; "Varanasi, India" -> "Varanasi".
export function locationOf(place: string): string {
  const parts = place
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const withoutCountry = parts.filter((p) => p.toLowerCase() !== "india");
  const chosen = withoutCountry[withoutCountry.length - 1] ?? parts[parts.length - 1] ?? "";
  return chosen.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Categories in the order they are shown: black & white, colour, then the most used.
export function sortedCategories(counts: Map<string, number>): [string, number][] {
  const rank = (t: string) => (t === BW ? 0 : t === COLOUR ? 1 : 2);
  return [...counts.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function countTags(photos: readonly { tags?: string[] | null }[]) {
  const counts = new Map<string, number>();
  for (const p of photos) for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}

export function countPlaces(photos: readonly { place: string }[]) {
  const counts = new Map<string, number>();
  for (const p of photos) {
    const loc = locationOf(p.place);
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
