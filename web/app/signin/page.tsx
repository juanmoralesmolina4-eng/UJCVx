import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SigninForm } from "./signin-form";

export const metadata = {
  title: "Ingreso — UJCVx",
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;

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
            Sistema de programación académica
          </p>
        </header>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SigninForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
