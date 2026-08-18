import Link from "next/link";

export function ProcesoNoEncontrado() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Proceso no encontrado</h2>
      <p className="text-sm text-muted-foreground">
        El proceso de seguimiento que buscas no existe o fue eliminado.
      </p>
      <Link
        href="/seguimiento"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Volver a seguimiento
      </Link>
    </div>
  );
}
