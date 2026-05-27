"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { crearCuenta, ingresar } from "./actions";

type Modo = "ingresar" | "crear";

export function SigninForm({ redirectTo }: { redirectTo?: string }) {
  const [modo, setModo] = useState<Modo>("ingresar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aviso, setAviso] = useState<{
    tipo: "error" | "info";
    texto: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);
    if (redirectTo) fd.append("redirectTo", redirectTo);

    startTransition(async () => {
      const r =
        modo === "ingresar" ? await ingresar(fd) : await crearCuenta(fd);
      if (!r.ok) {
        setAviso({
          tipo:
            modo === "crear" && r.mensaje?.includes("Revise") ? "info" : "error",
          texto: r.mensaje ?? "Error",
        });
      }
    });
  }

  return (
    <Tabs
      value={modo}
      onValueChange={(v) => {
        setModo(v as Modo);
        setAviso(null);
      }}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ingresar">Ingresar</TabsTrigger>
        <TabsTrigger value="crear">Crear cuenta</TabsTrigger>
      </TabsList>

      <TabsContent value={modo} className="mt-4">
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo institucional</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ujcv.edu.hn"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={modo === "crear" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={modo === "crear" ? "Mínimo 8 caracteres" : ""}
            />
          </div>

          {aviso && (
            <p
              className={`text-xs ${
                aviso.tipo === "error"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {aviso.texto}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending || !email || !password}
            className="w-full"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modo === "ingresar" ? "Ingresar" : "Crear cuenta"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
