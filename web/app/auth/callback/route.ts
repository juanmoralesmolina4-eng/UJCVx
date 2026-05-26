/**
 * Callback de Supabase Auth: intercambia el code del magic link por una
 * sesión y redirige al destino original.
 *
 * Importante: las cookies se DEBEN escribir en el `NextResponse` que se
 * devuelve, no en el cookie store global, porque el redirect crea una
 * respuesta nueva. Sin esto la sesión no persiste y el proxy te manda
 * de vuelta a /signin.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/signin?mensaje=falta_code", url.origin));
  }

  let response = NextResponse.redirect(new URL(next, url.origin));

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/signin?mensaje=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return response;
}
