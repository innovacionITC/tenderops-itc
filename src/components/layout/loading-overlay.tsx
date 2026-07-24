import { Spinner } from "@/components/ui/spinner";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs">
      <div className="flex items-center gap-3 rounded-xl bg-popover px-5 py-4 text-sm text-popover-foreground ring-1 ring-foreground/10 shadow-lg">
        <Spinner className="size-5" />
        Cargando…
      </div>
    </div>
  );
}
