export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-20">
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
            automáticamente, detecta solapes de aula, conflictos de
            catedrático, duplicados y errores de captura, y genera el
            archivo de pago listo para Recursos Humanos.
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

        <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
          Campus Tegucigalpa · Campus Comayagua
        </footer>
      </div>
    </main>
  );
}
