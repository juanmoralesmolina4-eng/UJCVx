import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const ITEMS = [
  { href: "/cargar", label: "Cargar" },
  { href: "/importaciones", label: "Historial" },
  { href: "/validacion", label: "Validación" },
  { href: "/eficiencia", label: "Eficiencia" },
  { href: "/catedraticos", label: "Catedráticos" },
  { href: "/aulas", label: "Aulas" },
  { href: "/pagos", label: "Pagos" },
];

export async function Nav() {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          UJCVx
        </Link>
        {user && (
          <ul className="flex flex-wrap gap-5 text-sm text-zinc-600 dark:text-zinc-400">
            {ITEMS.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {user ? (
          <form action="/auth/signout" method="post" className="flex items-center gap-3">
            <span className="text-xs text-zinc-500" title={user.email ?? undefined}>
              {user.email}
            </span>
            <button
              type="submit"
              className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Salir
            </button>
          </form>
        ) : (
          <Link
            href="/signin"
            className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}
