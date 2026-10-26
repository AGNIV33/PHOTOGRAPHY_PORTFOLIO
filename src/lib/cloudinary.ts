import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { site } from "@/config/site";
import { cloudinaryEnv } from "@/lib/env";

cloudinary.config({
  cloud_name: cloudinaryEnv.cloudName,
  api_key: cloudinaryEnv.apiKey,
  api_secret: cloudinaryEnv.apiSecret,
  secure: true,
});

export const UPLOAD_FOLDER = "portfolio";
// Photos are stored as "authenticated": they can only be viewed through links our server signs.
export const DELIVERY_TYPE = "authenticated";
// Shrinks anything larger on the way in, so full-size originals never live online.
export const INCOMING_TRANSFORMATION = "c_limit,w_2400,h_2400";

// Parameters the browser needs to upload straight to Cloudinary (big files skip our server).
export function signUpload() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: UPLOAD_FOLDER,
    type: DELIVERY_TYPE,
    transformation: INCOMING_TRANSFORMATION,
  };
  const signature = cloudinary.utils.api_sign_request(
    params,
    cloudinaryEnv.apiSecret,
  );
  return {
    ...params,
    signature,
    apiKey: cloudinaryEnv.apiKey,
    cloudName: cloudinaryEnv.cloudName,
  };
}

type Size = "card" | "thumb" | "large";

// A signed, watermarked, web-size link. Delivered files carry no camera or GPS metadata.
// "card" is the 720px size used on the home page.
export function imageUrl(publicId: string, size: Size) {
  const width = size === "card" ? 720 : size === "thumb" ? 900 : 2000;
  return cloudinary.url(publicId, {
    type: DELIVERY_TYPE,
    sign_url: true,
    transformation: [
      { width, height: width, crop: "limit" },
      {
        overlay: {
          font_family: "Arial",
          font_size: size === "large" ? 30 : size === "thumb" ? 16 : 14,
          font_weight: "bold",
          text: `© ${site.name}`,
        },
        color: "#ffffff",
        opacity: 45,
        gravity: "south_east",
        x: size === "large" ? 28 : 12,
        y: size === "large" ? 24 : 10,
      },
      { fetch_format: "auto", quality: "auto" },
    ],
  });
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { type: DELIVERY_TYPE, invalidate: true });
}

// ---------- Link preview pictures (Achievements) ----------
// Pictures for the link cards on the Achievements page. Unlike his photographs these are
// ordinary public images (they come from other websites), so no watermark and no signing.

export const PREVIEW_FOLDER = "previews";
const PREVIEW_SIZE = "c_limit,w_1200,h_1200";

export function signPreviewUpload() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: PREVIEW_FOLDER, type: "upload", transformation: PREVIEW_SIZE };
  return {
    ...params,
    signature: cloudinary.utils.api_sign_request(params, cloudinaryEnv.apiSecret),
    apiKey: cloudinaryEnv.apiKey,
    cloudName: cloudinaryEnv.cloudName,
  };
}

// Cloudinary's own servers download the picture, not ours, and shrink it on the way in.
export async function importPreviewImage(remoteUrl: string) {
  const res = await cloudinary.uploader.upload(remoteUrl, {
    folder: PREVIEW_FOLDER,
    type: "upload",
    resource_type: "image",
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  });
  return res.public_id as string;
}

export function previewImageUrl(publicId: string) {
  return cloudinary.url(publicId, {
    type: "upload",
    secure: true,
    transformation: [{ width: 900, height: 900, crop: "limit" }, { fetch_format: "auto", quality: "auto" }],
  });
}

// Only ever deletes inside the previews folder, never his photographs.
export async function deletePreviewImage(publicId: string) {
  if (!publicId.startsWith(`${PREVIEW_FOLDER}/`)) return;
  await cloudinary.uploader.destroy(publicId, { type: "upload", invalidate: true });
}
