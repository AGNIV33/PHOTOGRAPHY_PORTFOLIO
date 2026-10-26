// Reads keys from .env / .env.local. Until they are filled in, the site runs with placeholder frames.

// Forgive common copy-paste slips: surrounding spaces or quotes.
function read(name: string) {
  return (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

// People often copy the "REST URL" (…supabase.co/rest/v1/) instead of the project URL.
export const supabaseUrl = read("NEXT_PUBLIC_SUPABASE_URL").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
export const supabaseAnonKey = read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const supabaseSecretKey = read("SUPABASE_SERVICE_ROLE_KEY");

export const cloudinaryEnv = {
  cloudName: read("CLOUDINARY_CLOUD_NAME"),
  apiKey: read("CLOUDINARY_API_KEY"),
  apiSecret: read("CLOUDINARY_API_SECRET"),
};

// Optional: lets the dashboard suggest photo categories (Street, Nature, ...) by looking at
// each picture. Either a free NVIDIA key (NVIDIA_API_KEY) or an Anthropic key.
export const nvidiaKey = read("NVIDIA_API_KEY");
export const nvidiaModel = read("NVIDIA_VISION_MODEL") || "meta/llama-3.2-90b-vision-instruct";
export const anthropicKey = read("ANTHROPIC_API_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const isCloudinaryConfigured = Boolean(
  cloudinaryEnv.cloudName && cloudinaryEnv.apiKey && cloudinaryEnv.apiSecret,
);

export const isBackendReady = isSupabaseConfigured && isCloudinaryConfigured && Boolean(supabaseSecretKey);
