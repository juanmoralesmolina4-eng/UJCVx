import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Cierra la sesión y redirige a /signin. Las cookies de Supabase se escriben
 * directamente sobre el NextResponse de redirect para garantizar que el
 * navegador realmente se quede sin sesión (en Route Handlers, escribir a
 * `cookies()` no siempre se aplica al redirect).
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/signin", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.signOut();
  return response;
}
