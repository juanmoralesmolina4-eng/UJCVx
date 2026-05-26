"use client";

import { useState, useTransition } from "react";

import { enviarMagicLink } from "./actions";

export function SigninForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData();
        fd.append("email", email);
        if (redirectTo) fd.append("redirectTo", redirectTo);
        startTransition(async () => {
          const r = await enviarMagicLink(fd);
          if (!r.ok) {
            setError(r.mensaje ?? "Error");
          }
        });
      }}
      className="mt-5 space-y-3"
    >
      <label className="block">
        <span className="block text-xs uppercase tracking-widest text-zinc-500">
          Correo
        </span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !email}
        className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}
