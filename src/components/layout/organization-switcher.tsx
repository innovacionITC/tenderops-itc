"use client";

import { useTransition } from "react";
import { Building2, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { switchOrganization } from "@/lib/auth/switch-organization";
import type { OrganizationSummary } from "@/lib/auth/session";

export function OrganizationSwitcher({
  activeOrganizationId,
  organizations,
}: {
  activeOrganizationId: string;
  organizations: OrganizationSummary[];
}) {
  const [pending, startTransition] = useTransition();

  if (organizations.length <= 1) {
    const org = organizations[0];
    return (
      <div className="hidden items-center gap-1.5 truncate text-sm text-muted-foreground sm:flex">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium text-foreground">{org?.name ?? "—"}</span>
      </div>
    );
  }

  function handleSwitch(orgId: string) {
    if (orgId === activeOrganizationId) return;
    startTransition(async () => {
      await switchOrganization(orgId);
    });
  }

  return (
    <Select value={activeOrganizationId} onValueChange={handleSwitch} disabled={pending}>
      <SelectTrigger className="hidden h-8 w-auto gap-1.5 border-none bg-transparent px-2 text-sm shadow-none hover:bg-accent sm:flex">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue className="truncate font-medium text-foreground" />
        <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent align="start" className="w-[220px]">
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id} className="text-sm">
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
