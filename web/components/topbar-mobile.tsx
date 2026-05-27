"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ITEMS = [
  { href: "/", label: "Panel" },
  { href: "/cargar", label: "Cargar" },
  { href: "/importaciones", label: "Historial" },
  { href: "/validacion", label: "Validación" },
  { href: "/eficiencia", label: "Eficiencia" },
  { href: "/catedraticos", label: "Catedráticos" },
  { href: "/aulas", label: "Aulas" },
  { href: "/pagos", label: "Pagos" },
];

export function TopbarMobile({ correoUsuario }: { correoUsuario?: string }) {
  const inicial = correoUsuario?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-foreground text-background text-xs font-bold">
          U
        </div>
        <span className="text-sm font-semibold">UJCVx</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded p-1 hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{inicial}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {correoUsuario && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {correoUsuario}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {ITEMS.map((it) => (
            <DropdownMenuItem key={it.href} asChild>
              <Link href={it.href}>{it.label}</Link>
            </DropdownMenuItem>
          ))}
          {correoUsuario && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/auth/signout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </a>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
