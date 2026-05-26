import { checkSupabase } from "@/lib/supabase/status";

export default async function Home() {
  const status = await checkSupabase();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Universidad José Cecilio del Valle
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">UJCVx</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Sistema de programación académica y gestión de pagos docentes.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">¿Qué hace?</h2>
        <p className="mt-3 text-zinc-700 dark:text-zinc-300">
          Toma la programación académica de cada período, la valida
          automáticamente, detecta solapes de aula, conflictos de catedrático,
          duplicados y errores de captura, y genera el archivo de pago listo
          para Recursos Humanos.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Estado actual</h2>
        <ul className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>· Pipeline de validación en Python — funcionando.</li>
          <li>· Generador de archivo de pago (formato RRHH) — funcionando.</li>
          <li>· Métricas de eficiencia de aula y docente — funcionando.</li>
          <li>· Schema de base de datos multi-campus — diseñado.</li>
          <li>· Aplicación web — en construcción.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Conexión a Supabase</h2>
        <SupabaseStatusCard status={status} />
      </section>

      <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        Campus Tegucigalpa · Campus Comayagua
      </footer>
    </main>
  );
}

function SupabaseStatusCard({
  status,
}: {
  status: Awaited<ReturnType<typeof checkSupabase>>;
}) {
  if (status.ok) {
    return (
      <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="font-medium text-emerald-700 dark:text-emerald-300">
          Conectado
        </p>
        <p className="mt-1 break-all text-zinc-600 dark:text-zinc-400">
          {status.url}
        </p>
      </div>
    );
  }

  if (status.reason === "no_env") {
    return (
      <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <p className="font-medium text-amber-700 dark:text-amber-300">
          Sin variables de entorno
        </p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-400">
          Crea <code>web/.env.local</code> con{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Ver{" "}
          <code>web/supabase/SETUP.md</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded border border-rose-300 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
      <p className="font-medium text-rose-700 dark:text-rose-300">
        No se pudo conectar
      </p>
      {status.detail && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{status.detail}</p>
      )}
    </div>
  );
}
