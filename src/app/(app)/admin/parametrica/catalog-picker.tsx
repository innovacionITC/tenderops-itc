"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ItcButton, ItcInput } from "@/components/itc";
import { Spinner } from "@/components/ui/spinner";

export type PickerItem = { id: string; label: string };

export function CatalogPicker({
  title,
  items,
  selectedIds,
  onToggle,
  onQuickAdd,
  onItemCreated,
  emptyHint,
}: {
  title: string;
  items: PickerItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onQuickAdd?: (label: string) => Promise<PickerItem>;
  onItemCreated?: (item: PickerItem) => void;
  emptyHint?: React.ReactNode;
}) {
  const [filter, setFilter] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, filter]);

  const handleQuickAdd = () => {
    const label = newLabel.trim();
    if (!label || !onQuickAdd) return;
    startTransition(async () => {
      try {
        const created = await onQuickAdd(label);
        onItemCreated?.(created);
        onToggle(created.id);
        setNewLabel("");
        toast.success(`"${created.label}" agregado`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo agregar");
      }
    });
  };

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{selectedIds.size} seleccionados</span>
      </div>
      <ItcInput
        placeholder="Filtrar…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-2"
      />
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {filtered.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50"
          >
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={() => onToggle(item.id)}
            />
            <span className="truncate">{item.label}</span>
          </label>
        ))}
        {filtered.length === 0 &&
          (emptyHint ?? <p className="p-2 text-xs text-muted-foreground">Sin resultados.</p>)}
      </div>
      {onQuickAdd && (
        <div className="mt-2 flex gap-1.5 border-t pt-2">
          <ItcInput
            placeholder="Agregar nuevo…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
          />
          <ItcButton
            type="button"
            variant="secondary"
            disabled={isPending || !newLabel.trim()}
            onClick={handleQuickAdd}
          >
            {isPending ? <Spinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </ItcButton>
        </div>
      )}
    </div>
  );
}
