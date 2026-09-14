"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Spinner } from "@/components/ui/spinner";

export type PickerItem = { id: string; label: string };

export function CatalogPicker({
  title,
  items,
  selectedIds,
  onToggle,
  onQuickAdd,
  onItemCreated,
  onDelete,
  emptyHint,
}: {
  title: string;
  items: PickerItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onQuickAdd?: (label: string) => Promise<PickerItem>;
  onItemCreated?: (item: PickerItem) => void;
  /** Cuando se pasa, cada fila muestra un botón para eliminar el ítem del catálogo. */
  onDelete?: (id: string) => Promise<void>;
  emptyHint?: React.ReactNode;
}) {
  const [filter, setFilter] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<PickerItem | null>(null);

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

  const handleDelete = () => {
    if (!deleteTarget || !onDelete) return;
    const target = deleteTarget;
    startTransition(async () => {
      try {
        await onDelete(target.id);
        setDeleteTarget(null);
        toast.success(`"${target.label}" eliminado`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
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
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50"
          >
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => onToggle(item.id)}
              />
              <span className="truncate">{item.label}</span>
            </label>
            {onDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                aria-label={`Eliminar ${item.label}`}
                title="Eliminar"
                className="shrink-0 cursor-pointer rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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

      {onDelete && (
        <ItcModal
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="¿Eliminar del catálogo?"
          content={
            <p className="text-sm text-muted-foreground">
              Se eliminará <span className="font-medium">{deleteTarget?.label}</span> del catálogo.
              Si estaba seleccionado como filtro, también se quitará de ahí.
            </p>
          }
          variant="confirm"
          disabled={isPending}
        />
      )}
    </div>
  );
}
