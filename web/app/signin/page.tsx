import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SigninForm } from "./signin-form";

export const metadata = {
  title: "Ingresar — UJCVx",
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; mensaje?: string }>;
}) {
  const { redirect: redirectTo, mensaje } = await searchParams;

  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (user) {
    redirect(redirectTo || "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Universidad José Cecilio del Valle
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">UJCVx</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sistema de programación académica.
          </p>
        </header>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Ingresar</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Te mandamos un enlace mágico al correo. Sin contraseñas.
          </p>

          {mensaje === "revisa-correo" && (
            <div className="mt-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Revisa tu correo
              </p>
              <p className="mt-1 text-zinc-700 dark:text-zinc-400">
                Te enviamos un enlace para ingresar. Si no lo ves, revisa la
                carpeta de spam.
              </p>
            </div>
          )}

          <SigninForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
