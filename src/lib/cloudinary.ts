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

type Size = "thumb" | "large";

// A signed, watermarked, web-size link. Delivered files carry no camera or GPS metadata.
export function imageUrl(publicId: string, size: Size) {
  const width = size === "thumb" ? 900 : 2000;
  return cloudinary.url(publicId, {
    type: DELIVERY_TYPE,
    sign_url: true,
    transformation: [
      { width, height: width, crop: "limit" },
      {
        overlay: {
          font_family: "Arial",
          font_size: size === "thumb" ? 16 : 30,
          font_weight: "bold",
          text: `© ${site.name}`,
        },
        color: "#ffffff",
        opacity: 45,
        gravity: "south_east",
        x: size === "thumb" ? 12 : 28,
        y: size === "thumb" ? 10 : 24,
      },
      { fetch_format: "auto", quality: "auto" },
    ],
  });
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { type: DELIVERY_TYPE, invalidate: true });
}
