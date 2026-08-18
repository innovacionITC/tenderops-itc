"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function WorkspaceModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Sheet defaultOpen onOpenChange={(open) => !open && router.back()}>
      <SheetContent>
        <SheetTitle className="sr-only">Detalle de proceso</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
