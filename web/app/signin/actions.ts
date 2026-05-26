"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ResultadoMagicLink {
  ok: boolean;
  mensaje?: string;
}

export async function enviarMagicLink(
  formData: FormData,
): Promise<ResultadoMagicLink> {
  const email = String(formData.get("email") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !email.includes("@")) {
    return { ok: false, mensaje: "Correo inválido" };
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const sb = await createSupabaseServerClient();

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  redirect(`/signin?mensaje=revisa-correo&redirect=${encodeURIComponent(redirectTo)}`);
}
