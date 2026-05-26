import Link from "next/link";

const ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/cargar", label: "Cargar" },
  { href: "/importaciones", label: "Historial" },
  { href: "/validacion", label: "Validación" },
  { href: "/eficiencia", label: "Eficiencia" },
  { href: "/catedraticos", label: "Catedráticos" },
  { href: "/aulas", label: "Aulas" },
  { href: "/pagos", label: "Pagos" },
];

export function Nav() {
  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          UJCVx
        </Link>
        <ul className="flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
          {ITEMS.slice(1).map((it) => (
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
      </div>
    </nav>
  );
}
