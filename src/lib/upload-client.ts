// Sends a file straight from the browser to Cloudinary, using a signature from our server.
import type { getUploadSignature } from "@/app/admin/actions";

export type Signature = Awaited<ReturnType<typeof getUploadSignature>>;

export function uploadToCloudinary(file: File, sig: Signature, onProgress: (p: number) => void) {
  return new Promise<{ public_id: string; width: number; height: number }>((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", sig.apiKey);
    body.append("timestamp", String(sig.timestamp));
    body.append("signature", sig.signature);
    body.append("folder", sig.folder);
    body.append("type", sig.type);
    body.append("transformation", sig.transformation);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ public_id: res.public_id, width: res.width, height: res.height });
      } else {
        reject(new Error(res.error?.message ?? "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network problem. Check the internet and try again."));
    xhr.send(body);
  });
}
