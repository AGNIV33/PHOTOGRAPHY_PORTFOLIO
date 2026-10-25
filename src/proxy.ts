import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseKey, publicSupabaseUrl } from "@/lib/supabase/public-env";

// Keeps the visitor's sign-in session fresh on every page request.
export async function proxy(request: NextRequest) {
  const url = publicSupabaseUrl;
  const key = publicSupabaseKey;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|hero/|.*\\.(?:png|jpg|jpeg|webp|svg|txt)$).*)"],
};
