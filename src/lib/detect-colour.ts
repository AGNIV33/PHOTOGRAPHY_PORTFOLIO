import { BW, COLOUR } from "@/lib/categories";

// In the browser: is this picture black and white or colour? Looks at a tiny copy.
// Returns null when the browser cannot open the file (for example some HEIC photos); the
// server checks again when the photo is saved, so nothing is lost.
export async function detectColour(file: File): Promise<typeof BW | typeof COLOUR | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = 48;
    const scale = Math.min(size / bitmap.width, size / bitmap.height, 1);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const { data } = ctx.getImageData(0, 0, w, h);
    let colourful = 0;
    let total = 0;
    let sx = 0;
    let sy = 0;
    let sat = 0;
    for (let i = 0; i + 3 < data.length; i += 4) {
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
      let hue = 0;
      if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) hue = (b - r) / d + 2;
      else hue = (r - g) / d + 4;
      const a = (hue * 60 * Math.PI) / 180;
      colourful++;
      sx += Math.cos(a);
      sy += Math.sin(a);
      sat += s;
    }
    if (colourful < total * 0.05) return BW;
    if (Math.hypot(sx, sy) / colourful > 0.97 && sat / colourful < 0.4) return BW;
    return COLOUR;
  } catch {
    return null;
  }
}

// Width / height of a picture, for the preview. 3:2 when the browser cannot read the file.
export async function fileRatio(file: File): Promise<number> {
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = bitmap.width / Math.max(bitmap.height, 1);
    bitmap.close?.();
    return ratio > 0 ? ratio : 1.5;
  } catch {
    return 1.5;
  }
}
