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

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const isCloudinaryConfigured = Boolean(
  cloudinaryEnv.cloudName && cloudinaryEnv.apiKey && cloudinaryEnv.apiSecret,
);

export const isBackendReady = isSupabaseConfigured && isCloudinaryConfigured && Boolean(supabaseSecretKey);
