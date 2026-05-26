"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export interface ResultadoAuth {
  ok: boolean;
  mensaje?: string;
}

async function clienteAuth() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignored
          }
        },
      },
    },
  );
}

export async function ingresar(formData: FormData): Promise<ResultadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !email.includes("@")) {
    return { ok: false, mensaje: "Correo no válido" };
  }
  if (!password) {
    return { ok: false, mensaje: "La contraseña es requerida" };
  }

  const sb = await clienteAuth();
  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, mensaje: traducirError(error.message) };
  }

  redirect(redirectTo);
}

export async function crearCuenta(formData: FormData): Promise<ResultadoAuth> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !email.includes("@")) {
    return { ok: false, mensaje: "Correo no válido" };
  }
  if (password.length < 8) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres" };
  }

  const sb = await clienteAuth();
  const { data, error } = await sb.auth.signUp({ email, password });

  if (error) {
    return { ok: false, mensaje: traducirError(error.message) };
  }

  // Si Supabase tiene confirmación de correo activada, no hay sesión aún
  if (!data.session) {
    return {
      ok: false,
      mensaje:
        "Cuenta creada. Revise su correo para confirmar el registro antes de ingresar.",
    };
  }

  redirect(redirectTo);
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Correo o contraseña incorrectos";
  if (m.includes("user already registered"))
    return "Ya existe una cuenta con ese correo. Use la opción de ingresar.";
  if (m.includes("email rate limit"))
    return "Se han enviado demasiados correos. Espere unos minutos.";
  if (m.includes("for security purposes")) return msg; // mantener el original con tiempo
  return msg;
}
