import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldX className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold text-foreground">Acceso no autorizado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        No tienes los permisos necesarios para ingresar a esta sección. Contacta al administrador del
        sistema si crees que esto es un error.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}
