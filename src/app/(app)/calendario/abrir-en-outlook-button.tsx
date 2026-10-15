"use client";

import { ExternalLink } from "lucide-react";
import { ItcButton } from "@/components/itc";

export function AbrirEnOutlookButton({ url }: { url: string }) {
  return (
    <ItcButton variant="secondary" href={url} target="_blank" rel="noopener noreferrer">
      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
      Abrir calendario en Outlook
    </ItcButton>
  );
}
