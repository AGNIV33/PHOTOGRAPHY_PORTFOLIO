import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { analysisUrl } from "@/lib/cloudinary";
import { BW, COLOUR, STYLE_TAGS, cleanTags, hasColourTag, withColourTag } from "@/lib/categories";
import { anthropicKey } from "@/lib/env";

// Works out a photograph's categories.
// - Black & white or colour: measured from the picture itself (free, no AI needed).
// - Style (Street, Nature, Landscape, ...): Claude looks at the picture, when an
//   ANTHROPIC_API_KEY is set. Without a key, the style categories are added by hand.

async function loadBytes(publicId: string) {
  const res = await fetch(analysisUrl(publicId), { cache: "no-store" });
  if (!res.ok) throw new Error(`Picture not available (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// Black and white (also toned: sepia, blue) when almost nothing in the picture is colourful,
// or all the colour is one single tint.
async function measureColour(bytes: Buffer): Promise<typeof BW | typeof COLOUR> {
  const { data } = await sharp(bytes).resize(48, 48, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let colourful = 0;
  let total = 0;
  let sx = 0;
  let sy = 0;
  let sat = 0;
  for (let i = 0; i + 2 < data.length; i += 3) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    total++;
    if (max === min || l < 0.08 || l > 0.95) continue;
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (s < 0.18) continue;
    let h = 0;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    const a = (h * 60 * Math.PI) / 180;
    colourful++;
    sx += Math.cos(a);
    sy += Math.sin(a);
    sat += s;
  }
  if (colourful < total * 0.05) return BW;
  // One narrow hue with soft colour: a toned black-and-white print.
  const concentration = Math.hypot(sx, sy) / colourful;
  if (concentration > 0.97 && sat / colourful < 0.4) return BW;
  return COLOUR;
}

const SCHEMA = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      description: "The one to three categories that fit this photograph best, most fitting first.",
      items: { type: "string", enum: [...STYLE_TAGS] },
    },
  },
  required: ["categories"],
  additionalProperties: false,
} as const;

async function suggestStyles(bytes: Buffer): Promise<string[]> {
  if (!anthropicKey) return [];
  const client = new Anthropic({ apiKey: anthropicKey });
  const res = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system:
      "You file photographs from a street and documentary photographer's portfolio into categories for a website filter. " +
      "Choose only from the allowed categories. Pick the one to three that describe the photograph best, " +
      "judging by its main subject and mood. Street means everyday life in public places.",
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: bytes.toString("base64") } },
          { type: "text", text: "Which categories fit this photograph?" },
        ],
      },
    ],
  });
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return [];
  const parsed = JSON.parse(text.text) as { categories?: string[] };
  return cleanTags(parsed.categories ?? []).filter((t) => (STYLE_TAGS as readonly string[]).includes(t));
}

export const aiAvailable = Boolean(anthropicKey);

// The categories for one picture. Never throws: on any trouble it returns what it could work out.
export async function analyzePhoto(publicId: string, opts: { styles?: boolean } = {}) {
  const out: { colour: typeof BW | typeof COLOUR | null; styles: string[]; aiUsed: boolean } = { colour: null, styles: [], aiUsed: false };
  let bytes: Buffer;
  try {
    bytes = await loadBytes(publicId);
  } catch {
    return out;
  }
  try {
    out.colour = await measureColour(bytes);
  } catch {}
  if (opts.styles !== false && anthropicKey) {
    try {
      out.styles = await suggestStyles(bytes);
      out.aiUsed = true;
    } catch (e) {
      console.warn("Photo categories: the AI step failed", e instanceof Error ? e.message : e);
    }
  }
  return out;
}

// Adds what was found to the tags already on the photo. Existing choices are kept.
export function mergeTags(existing: readonly string[], found: Awaited<ReturnType<typeof analyzePhoto>>) {
  let tags = cleanTags(existing);
  if (found.colour && !hasColourTag(tags)) tags = withColourTag(tags, found.colour);
  return cleanTags([...tags, ...found.styles]);
}
