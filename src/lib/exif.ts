// Reads camera details from a photo file in the browser, before upload.
// GPS is never read or stored; only the place name typed by hand is shown.
import exifr from "exifr";

export type CameraDetails = {
  taken_at: string;
  camera: string;
  lens: string;
  focal_length: string;
  aperture: string;
  shutter: string;
  iso: string;
};

export const emptyDetails: CameraDetails = {
  taken_at: "",
  camera: "",
  lens: "",
  focal_length: "",
  aperture: "",
  shutter: "",
  iso: "",
};

type Raw = {
  Make?: string;
  Model?: string;
  LensModel?: string;
  FocalLength?: number;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  DateTimeOriginal?: Date;
  CreateDate?: Date;
};

function cameraName(make?: string, model?: string) {
  if (!model) return make?.trim() ?? "";
  if (!make) return model.trim();
  // "NIKON CORPORATION" + "NIKON D7500" → "NIKON D7500"
  const brand = make.split(" ")[0];
  return model.toLowerCase().startsWith(brand.toLowerCase()) ? model.trim() : `${brand} ${model}`.trim();
}

function shutter(t?: number) {
  if (!t) return "";
  if (t >= 1) return `${Math.round(t * 10) / 10}s`;
  return `1/${Math.round(1 / t)}`;
}

function isoDate(d?: Date) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function readCameraDetails(file: File): Promise<CameraDetails> {
  try {
    const raw = (await exifr.parse(file, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
        "CreateDate",
      ],
    })) as Raw | undefined;
    if (!raw) return emptyDetails;
    return {
      taken_at: isoDate(raw.DateTimeOriginal ?? raw.CreateDate),
      camera: cameraName(raw.Make, raw.Model),
      lens: raw.LensModel?.trim() ?? "",
      focal_length: raw.FocalLength ? `${Math.round(raw.FocalLength)}mm` : "",
      aperture: raw.FNumber ? `f/${raw.FNumber}` : "",
      shutter: shutter(raw.ExposureTime),
      iso: raw.ISO ? String(raw.ISO) : "",
    };
  } catch {
    return emptyDetails;
  }
}
