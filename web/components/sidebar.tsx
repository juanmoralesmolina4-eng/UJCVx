"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  History,
  AlertTriangle,
  Activity,
  Users,
  DoorOpen,
  Wallet,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const SECCIONES = [
  {
    titulo: "General",
    items: [
      { href: "/", label: "Panel", icon: LayoutDashboard },
    ],
  },
  {
    titulo: "Programación",
    items: [
      { href: "/cargar", label: "Cargar", icon: Upload },
      { href: "/importaciones", label: "Historial", icon: History },
      { href: "/validacion", label: "Validación", icon: AlertTriangle },
      { href: "/eficiencia", label: "Eficiencia", icon: Activity },
    ],
  },
  {
    titulo: "Recursos",
    items: [
      { href: "/catedraticos", label: "Catedráticos", icon: Users },
      { href: "/aulas", label: "Aulas", icon: DoorOpen },
    ],
  },
  {
    titulo: "Pagos",
    items: [
      { href: "/pagos", label: "Generar pago", icon: Wallet },
    ],
  },
];

export function Sidebar({ correoUsuario }: { correoUsuario?: string }) {
  const pathname = usePathname();
  const inicial = correoUsuario?.[0]?.toUpperCase() ?? "U";

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
          U
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">UJCVx</span>
          <span className="text-xs text-muted-foreground">UJCV</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECCIONES.map((sec) => (
          <div key={sec.titulo} className="mb-4">
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {sec.titulo}
            </p>
            <ul className="space-y-0.5">
              {sec.items.map((item) => {
                const activo =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icono = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors",
                        activo
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <Icono className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {correoUsuario && (
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded p-2 hover:bg-accent">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{inicial}</AvatarFallback>
                </Avatar>
                <span className="truncate text-left text-xs">
                  {correoUsuario}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {correoUsuario}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
