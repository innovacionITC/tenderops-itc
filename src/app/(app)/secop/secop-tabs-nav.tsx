"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ItcTabs } from "@/components/itc";
import { Spinner } from "@/components/ui/spinner";
import type { Vista } from "./vista";

const TABS = [
  { key: "detectados", label: "Procesos detectados" },
  { key: "monitoreadas", label: "Entidades monitoreadas" },
  { key: "vivo", label: "Búsqueda en vivo" },
] satisfies { key: Vista; label: string }[];

export function SecopTabsNav({ vista }: { vista: Vista }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <ItcTabs
        items={TABS}
        activeKey={vista}
        hideContent
        onChange={(key) => {
          startTransition(() => {
            router.push(key === "detectados" ? pathname : `${pathname}?vista=${key}`);
          });
        }}
      />
      {isPending && <Spinner className="size-3.5 text-muted-foreground" />}
    </div>
  );
}
