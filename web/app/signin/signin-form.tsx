"use client";

import { useState, useTransition } from "react";

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
      const r = modo === "ingresar" ? await ingresar(fd) : await crearCuenta(fd);
      if (!r.ok) {
        setAviso({
          tipo: modo === "crear" && r.mensaje?.includes("Revise") ? "info" : "error",
          texto: r.mensaje ?? "Error",
        });
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex border-b border-zinc-200 text-sm dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setModo("ingresar");
            setAviso(null);
          }}
          className={`flex-1 pb-2 ${
            modo === "ingresar"
              ? "border-b-2 border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => {
            setModo("crear");
            setAviso(null);
          }}
          className={`flex-1 pb-2 ${
            modo === "crear"
              ? "border-b-2 border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={enviar} className="space-y-3">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-zinc-500">
            Correo institucional
          </span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ujcv.edu.hn"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-zinc-500">
            Contraseña
          </span>
          <input
            type="password"
            required
            minLength={modo === "crear" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={modo === "crear" ? "Mínimo 8 caracteres" : ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>

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

        <button
          type="submit"
          disabled={isPending || !email || !password}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending
            ? "Procesando…"
            : modo === "ingresar"
              ? "Ingresar"
              : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
