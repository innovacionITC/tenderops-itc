"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Building2, Calculator, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  ItcTable,
  type TableColumn,
  ItcButton,
  ItcInput,
  ItcModal,
} from "@/components/itc";
import { Label } from "@/components/ui/label";
import { RowActionButton } from "@/components/layout/row-action-button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/layout/status-badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useFieldErrors } from "@/lib/form-errors";
import { canFollow, type AppRole } from "@/lib/auth/roles";
import type { SuborganizacionRow } from "@/lib/parametrica";
import { SuborganizacionesTable } from "../admin/suborganizaciones/suborganizaciones-table";
import { CatalogPicker } from "../admin/parametrica/catalog-picker";
import {
  guardarValores,
  crearIndicador,
  actualizarIndicador,
  eliminarIndicador,
  setIndicadorEstadoAction,
} from "./actions";
import { CalculadoraPluralPanel } from "./calculadora-plural-panel";
import { formatIndicadorValor } from "./format-valor";

type IndicadorRow = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  tipo: string;
  valorOrganizacionPrincipal: number | null;
  valoresSuborganizaciones: {
    suborganizacionId: string;
    suborganizacionNombre: string;
    valor: number | null;
  }[];
  isActive: boolean;
  formulaNumeradorIds: string[] | null;
  formulaDenominadorIds: string[] | null;
  formulaMultiplicador: number | null;
};

type SuborganizacionCol = {
  id: string;
  nombre: string;
};

type EditCell = {
  indicadorId: string;
  suborganizacionId: string | null;
  valor: string;
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; row: IndicadorRow }
  | null;

const UNIDADES = ["COP", "%", "ratio", "numero"] as const;
const TIPOS = ["base", "derivado"] as const;

function formatValor(valor: number | null, unidad: string): string {
  return formatIndicadorValor(valor, unidad, { emptyText: "Sin información", maxDecimalsCop: 2 });
}

export function IndicadoresView({
  indicadores,
  suborganizaciones,
  suborganizacionesAdmin,
  anio,
  userRole,
  organizationId,
  organizationName,
}: {
  indicadores: IndicadorRow[];
  suborganizaciones: SuborganizacionCol[];
  suborganizacionesAdmin: SuborganizacionRow[];
  anio: number;
  userRole: AppRole | null;
  organizationId: string;
  organizationName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
  const [editCells, setEditCells] = useState<EditCell[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<IndicadorRow | null>(null);
  const [pluralOpen, setPluralOpen] = useState(false);
  const [suborgsOpen, setSuborgsOpen] = useState(false);
  const [pendingEstadoId, setPendingEstadoId] = useState<string | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState<string>("COP");
  const [tipo, setTipo] = useState<string>("base");
  const [formulaNumeradorIds, setFormulaNumeradorIds] = useState(new Set<string>());
  const [formulaDenominadorIds, setFormulaDenominadorIds] = useState(new Set<string>());
  const [formulaMultiplicador, setFormulaMultiplicador] = useState("");

  const canEdit = canFollow(userRole);
  const anioActual = new Date().getFullYear();
  const anios = [anioActual, anioActual - 1, anioActual - 2];

  const toggleFormulaId = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const handleAnioChange = (nuevoAnio: string) => {
    startTransition(() => {
      router.push(`${pathname}?anio=${nuevoAnio}`);
    });
  };

  const openCreate = () => {
    setNombre("");
    setCategoria("");
    setUnidad("COP");
    setTipo("base");
    setFormulaNumeradorIds(new Set());
    setFormulaDenominadorIds(new Set());
    setFormulaMultiplicador("");
    setFieldErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: IndicadorRow) => {
    setNombre(row.nombre);
    setCategoria(row.categoria);
    setUnidad(row.unidad);
    setTipo(row.tipo);
    setFormulaNumeradorIds(new Set(row.formulaNumeradorIds ?? []));
    setFormulaDenominadorIds(new Set(row.formulaDenominadorIds ?? []));
    setFormulaMultiplicador(row.formulaMultiplicador?.toString() ?? "");
    setFieldErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSaveIndicador = () => {
    if (!nombre.trim()) {
      setFieldErrors({ nombre: "El nombre es obligatorio" });
      return;
    }
    if (!categoria.trim()) {
      setFieldErrors({ categoria: "La categoría es obligatoria" });
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        const input: Record<string, unknown> = { nombre, categoria, unidad, tipo };
        if (tipo === "derivado") {
          input.formulaNumeradorIds = Array.from(formulaNumeradorIds);
          input.formulaDenominadorIds = Array.from(formulaDenominadorIds);
          if (formulaMultiplicador) input.formulaMultiplicador = Number(formulaMultiplicador);
        }
        if (dialog?.mode === "create") {
          await crearIndicador(input as Parameters<typeof crearIndicador>[0]);
        } else if (dialog?.mode === "edit") {
          await actualizarIndicador(dialog.row.id, input as Parameters<typeof actualizarIndicador>[1]);
        }
        toast.success("Indicador guardado");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar el indicador");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await eliminarIndicador(deleteTarget.id);
        toast.success("Indicador eliminado");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar el indicador");
      }
    });
  };

  const handleEstadoChange = (row: IndicadorRow, estado: boolean) => {
    setPendingEstadoId(row.id);
    startTransition(async () => {
      try {
        await setIndicadorEstadoAction(row.id, estado);
        toast.success(estado ? "Indicador activado" : "Indicador desactivado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingEstadoId(null);
      }
    });
  };

  const enterEditMode = () => {
    const cells: EditCell[] = [];
    for (const ind of indicadores) {
      if (ind.tipo !== "base") continue;
      cells.push({
        indicadorId: ind.id,
        suborganizacionId: null,
        valor: ind.valorOrganizacionPrincipal?.toString() ?? "",
      });
      for (const v of ind.valoresSuborganizaciones) {
        cells.push({
          indicadorId: ind.id,
          suborganizacionId: v.suborganizacionId,
          valor: v.valor?.toString() ?? "",
        });
      }
    }
    setEditCells(cells);
    setEditMode(true);
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditCells([]);
  };

  const updateEditCell = (indicadorId: string, suborganizacionId: string | null, valor: string) => {
    setEditCells((prev) =>
      prev.map((c) =>
        c.indicadorId === indicadorId && c.suborganizacionId === suborganizacionId
          ? { ...c, valor }
          : c,
      ),
    );
  };

  const handleGuardarValores = () => {
    const valores = editCells
      .filter((c) => c.valor.trim() !== "")
      .map((c) => ({
        indicadorId: c.indicadorId,
        ...(c.suborganizacionId ? { suborganizacionId: c.suborganizacionId } : {}),
        valor: Number(c.valor),
      }));
    startTransition(async () => {
      try {
        await guardarValores(anio, valores);
        toast.success("Valores guardados");
        setEditMode(false);
        setEditCells([]);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudieron guardar los valores");
      }
    });
  };

  const getEditCellValue = (indicadorId: string, suborganizacionId: string | null): string => {
    return editCells.find(
      (c) => c.indicadorId === indicadorId && c.suborganizacionId === suborganizacionId,
    )?.valor ?? "";
  };

  const baseIndicadores = indicadores.filter((i) => i.tipo === "base");

  const columns: TableColumn<IndicadorRow>[] = [
    {
      key: "nombre",
      title: "Indicador",
      render: (r) => <span className="font-medium">{r.nombre}</span>,
    },
    {
      key: "categoria",
      title: "Categoría",
      render: (r) => <span className="text-sm text-muted-foreground">{r.categoria}</span>,
    },
    {
      key: "unidad",
      title: "Unidad",
      render: (r) => <span className="text-sm text-muted-foreground">{r.unidad}</span>,
    },
    {
      key: "org-principal",
      title: organizationName,
      render: (r) => {
        if (editMode && r.tipo === "base") {
          return (
            <ItcInput
              type="number"
              className="w-28"
              value={getEditCellValue(r.id, null)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateEditCell(r.id, null, e.target.value)}
            />
          );
        }
        const val = r.valorOrganizacionPrincipal;
        return (
          <span className={`text-sm ${val === null ? "italic text-muted-foreground" : ""}`}>
            {formatValor(val, r.unidad)}
          </span>
        );
      },
    },
    ...suborganizaciones.map((suborg) => ({
      key: `suborg-${suborg.id}`,
      title: suborg.nombre,
      render: (r: IndicadorRow) => {
        const v = r.valoresSuborganizaciones.find((vs) => vs.suborganizacionId === suborg.id);
        if (editMode && r.tipo === "base") {
          return (
            <ItcInput
              type="number"
              className="w-28"
              value={getEditCellValue(r.id, suborg.id)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateEditCell(r.id, suborg.id, e.target.value)}
            />
          );
        }
        const val = v?.valor ?? null;
        return (
          <span className={`text-sm ${val === null ? "italic text-muted-foreground" : ""}`}>
            {formatValor(val, r.unidad)}
          </span>
        );
      },
    })),
    {
      key: "estado",
      title: "Estado",
      render: (r: IndicadorRow) => {
        const rowPending = isPending && pendingEstadoId === r.id;
        const activo = r.isActive !== false;
        if (!canEdit) {
          return (
            <StatusBadge tone={activo ? "success" : "muted"}>
              {activo ? "Activo" : "Inactivo"}
            </StatusBadge>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={activo}
              disabled={rowPending}
              onCheckedChange={(checked: boolean) => handleEstadoChange(r, checked)}
            />
            <StatusBadge tone={activo ? "success" : "muted"}>
              {activo ? "Activo" : "Inactivo"}
            </StatusBadge>
            {rowPending && <Spinner className="size-3.5 text-muted-foreground" />}
          </div>
        );
      },
    },
    ...(canEdit
      ? [
          {
            key: "acciones",
            title: "",
            align: "right" as const,
            render: (r: IndicadorRow) => (
              <div className="flex justify-end gap-1">
                <RowActionButton
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  title="Editar"
                  onClick={() => openEdit(r)}
                />
                <RowActionButton
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  title="Eliminar"
                  onClick={() => setDeleteTarget(r)}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <Label className="mb-1.5">Año</Label>
            <ItcInput
              type="select"
              value={String(anio)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleAnioChange(e.target.value)}
            >
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </ItcInput>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              {editMode ? (
                <>
                  <ItcButton
                    variant="secondary"
                    onClick={cancelEditMode}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </ItcButton>
                  <ItcButton
                    onClick={handleGuardarValores}
                    disabled={isPending}
                  >
                    {isPending ? <Spinner className="size-3.5" /> : <Check className="h-4 w-4" />}
                    Guardar
                  </ItcButton>
                </>
              ) : (
                <>
                  <ItcButton
                    variant="secondary"
                    onClick={() => setSuborgsOpen(true)}
                  >
                    <Building2 className="h-4 w-4" /> Suborganizaciones
                  </ItcButton>
                  <ItcButton
                    variant="secondary"
                    onClick={() => setPluralOpen(true)}
                  >
                    <Calculator className="h-4 w-4" /> Calculadora plural
                  </ItcButton>
                  <ItcButton onClick={enterEditMode}>
                    <Pencil className="h-4 w-4" /> Editar valores
                  </ItcButton>
                  <ItcButton onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Nuevo indicador
                  </ItcButton>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {indicadores.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin indicadores para el año {anio}.
        </div>
      ) : (
        <ItcTable
          data={indicadores}
          columns={columns}
          rowKey={(r) => r.id}
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSaveIndicador}
        title={dialog?.mode === "create" ? "Nuevo indicador" : "Editar indicador"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Nombre <span className="text-destructive">*</span></Label>
              <ItcInput
                value={nombre}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setNombre(e.target.value); clearFieldError("nombre"); }}
                aria-invalid={!!fieldErrors.nombre}
              />
              {fieldErrors.nombre && <p className="mt-1 text-xs text-destructive">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <Label className="mb-1.5">Categoría <span className="text-destructive">*</span></Label>
              <ItcInput
                value={categoria}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setCategoria(e.target.value); clearFieldError("categoria"); }}
                aria-invalid={!!fieldErrors.categoria}
              />
              {fieldErrors.categoria && <p className="mt-1 text-xs text-destructive">{fieldErrors.categoria}</p>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="mb-1.5">Unidad</Label>
                <ItcInput type="select" value={unidad} onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setUnidad(e.target.value)}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </ItcInput>
              </div>
              <div className="flex-1">
                <Label className="mb-1.5">Tipo</Label>
                <ItcInput type="select" value={tipo} onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t === "base" ? "Base" : "Derivado"}</option>)}
                </ItcInput>
              </div>
            </div>
            {tipo === "derivado" && (
              <>
                <CatalogPicker
                  title="Indicadores base del numerador"
                  items={baseIndicadores.map((i) => ({ id: i.id, label: i.nombre }))}
                  selectedIds={formulaNumeradorIds}
                  onToggle={(id) => toggleFormulaId(formulaNumeradorIds, setFormulaNumeradorIds, id)}
                  emptyHint={
                    <p className="p-2 text-xs text-muted-foreground">
                      No hay indicadores base creados todavía.
                    </p>
                  }
                />
                <CatalogPicker
                  title="Indicadores base del denominador"
                  items={baseIndicadores.map((i) => ({ id: i.id, label: i.nombre }))}
                  selectedIds={formulaDenominadorIds}
                  onToggle={(id) => toggleFormulaId(formulaDenominadorIds, setFormulaDenominadorIds, id)}
                  emptyHint={
                    <p className="p-2 text-xs text-muted-foreground">
                      No hay indicadores base creados todavía.
                    </p>
                  }
                />
                <div>
                  <Label className="mb-1.5">Multiplicador</Label>
                  <ItcInput
                    type="number"
                    value={formulaMultiplicador}
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormulaMultiplicador(e.target.value)}
                    placeholder="1 (por defecto)"
                  />
                </div>
              </>
            )}
          </div>
        }
        variant="form"
        confirmText={dialog?.mode === "edit" ? "Guardar" : "Crear"}
        disabled={isPending}
      />

      <ItcModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar indicador?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium">{deleteTarget?.nombre}</span>.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />

      <Sheet open={pluralOpen} onOpenChange={setPluralOpen}>
        <SheetContent>
          <SheetTitle>Calculadora plural</SheetTitle>
          <SheetDescription>
            Consolidación de indicadores por método de participación.
          </SheetDescription>
          <CalculadoraPluralPanel
            anio={anio}
            organizationId={organizationId}
            organizationName={organizationName}
            suborganizaciones={suborganizaciones}
            indicadores={indicadores}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={suborgsOpen} onOpenChange={setSuborgsOpen}>
        <SheetContent>
          <SheetTitle>Suborganizaciones</SheetTitle>
          <SheetDescription>
            Empresas participantes de {organizationName} usadas en la calculadora plural.
          </SheetDescription>
          <div className="pt-4">
            <SuborganizacionesTable rows={suborganizacionesAdmin} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
