import { UploadForm } from "./upload-form";

export const metadata = {
  title: "Cargar programación — UJCVx",
};

export default function CargarPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">Cargar programación</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Arrastra el Excel de programación del período (con todas las hojas por
          carrera) o haz clic para seleccionar.
        </p>
      </header>

      <section className="mt-10">
        <UploadForm />
      </section>

      <section className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Lo que pasa al cargar
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Se guarda el archivo original en almacenamiento privado.</li>
          <li>Se normalizan los campos (horarios, nombres, alumnos).</li>
          <li>Se corren las 8 validaciones automáticas.</li>
          <li>Se calculan las métricas de eficiencia de aulas y docentes.</li>
          <li>Quedan disponibles los reportes y el archivo de pago RRHH.</li>
        </ol>
      </section>
    </main>
  );
}
