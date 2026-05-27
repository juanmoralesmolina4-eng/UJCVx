import { UploadForm } from "./upload-form";

export const metadata = {
  title: "Cargar — UJCVx",
};

export default function CargarPage() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cargar programación
        </h1>
        <p className="text-sm text-muted-foreground">
          Suba el archivo Excel del período para procesarlo y validarlo.
        </p>
      </header>

      <div className="max-w-2xl">
        <UploadForm />
      </div>
    </div>
  );
}
