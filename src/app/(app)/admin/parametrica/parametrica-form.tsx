"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ItcButton, ItcInput } from "@/components/itc";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/layout/status-badge";
import Link from "next/link";
import type { ParametricaConfig, CatalogItem } from "@/lib/parametrica";
import { formatMilesInput, parseMilesInput } from "@/lib/format";
import type { UnspscRow } from "@/lib/unspsc";
import { CatalogPicker, type PickerItem } from "./catalog-picker";
import { deleteEstadoSecop } from "../estados-secop/actions";
import { quickAddEstadoSecop, saveParametricaConfig } from "./actions";

function toPickerItems(items: CatalogItem[]): PickerItem[] {
  return items.map((i) => ({ id: i.id, label: i.label }));
}

export function ParametricaForm({
  config,
  catalogs,
  ciudadesSeleccionadas,
}: {
  config: ParametricaConfig | null;
  catalogs: {
    modalidades: CatalogItem[];
    entidades: CatalogItem[];
    estadosSecop: CatalogItem[];
    unspscCodes: UnspscRow[];
    departamentos: CatalogItem[];
  };
  /** Etiquetas de las ciudades ya guardadas: hidratan el picker asíncrono. */
  ciudadesSeleccionadas: CatalogItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [habilitado, setHabilitado] = useState(config?.habilitado ?? true);
  const [datasetSecopI, setDatasetSecopI] = useState(config?.datasetSecopI ?? false);
  const [datasetSecopIi, setDatasetSecopIi] = useState(config?.datasetSecopIi ?? true);
  const [diasHaciaAtras, setDiasHaciaAtras] = useState(config?.diasHaciaAtras ?? 30);
  const [intervalosCronMin, setIntervalosCronMin] = useState(config?.intervalosCronMin ?? 60);
  const [maxResultadosConsulta, setMaxResultadosConsulta] = useState(
    config?.maxResultadosConsulta ?? 100,
  );
  const [valorMinimo, setValorMinimo] = useState(config?.valorMinimo ?? "");
  const [valorMaximo, setValorMaximo] = useState(config?.valorMaximo ?? "");

  const [keywords, setKeywords] = useState<string[]>(config?.palabrasClave ?? []);
  const [newKeyword, setNewKeyword] = useState("");

  const unspscItems: PickerItem[] = catalogs.unspscCodes.map((c) => ({
    id: c.id,
    label: c.descripcion ? `${c.codigo} — ${c.descripcion}` : c.codigo,
  }));
  const estadoSecopItems: PickerItem[] = catalogs.estadosSecop.map((e) => ({
    id: e.id,
    label: e.label,
  }));

  const [modalidadIds] = useState(new Set(config?.modalidadIds ?? []));
  const [entidadIds] = useState(new Set(config?.entidadIds ?? []));
  const [estadoSecopIds, setEstadoSecopIds] = useState(new Set(config?.estadoSecopIds ?? []));
  const [unspscIds, setUnspscIds] = useState(new Set(config?.unspscIds ?? []));
  const [departamentoIds] = useState(new Set(config?.departamentoIds ?? []));
  // Ciudades guarda items completos (id + label): el catálogo no está en el
  // cliente, así que el label de cada selección debe conservarse aquí.
  const [ciudades] = useState<PickerItem[]>(toPickerItems(ciudadesSeleccionadas));

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const handleQuickAddEstadoSecop = async (label: string): Promise<PickerItem> => {
    const created = await quickAddEstadoSecop({ nombre: label });
    router.refresh();
    return created;
  };

  const handleDeleteEstadoSecop = async (id: string) => {
    await deleteEstadoSecop(id);
    setEstadoSecopIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    router.refresh();
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || keywords.includes(kw)) return;
    setKeywords([...keywords, kw]);
    setNewKeyword("");
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveParametricaConfig({
          habilitado,
          datasetSecopI,
          datasetSecopIi,
          diasHaciaAtras,
          intervalosCronMin,
          maxResultadosConsulta,
          valorMinimo: valorMinimo === "" ? null : Number(valorMinimo),
          valorMaximo: valorMaximo === "" ? null : Number(valorMaximo),
          palabrasClave: keywords,
          modalidadIds: Array.from(modalidadIds),
          entidadIds: Array.from(entidadIds),
          estadoSecopIds: Array.from(estadoSecopIds),
          unspscIds: Array.from(unspscIds),
          departamentoIds: Array.from(departamentoIds),
          ciudadIds: ciudades.map((c) => c.id),
        });
        toast.success("Configuración guardada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la configuración");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={habilitado} onCheckedChange={setHabilitado} />
              Búsqueda habilitada
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={datasetSecopI} onCheckedChange={setDatasetSecopI} />
              Dataset SECOP I
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={datasetSecopIi} onCheckedChange={setDatasetSecopIi} />
              Dataset SECOP II
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <Label className="mb-1.5">Días hacia atrás</Label>
              <ItcInput
                type="number"
                min={1}
                value={diasHaciaAtras}
                onChange={(e) => setDiasHaciaAtras(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Intervalo cron (min)</Label>
              <ItcInput
                type="number"
                min={1}
                value={intervalosCronMin}
                onChange={(e) => setIntervalosCronMin(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Máx. resultados</Label>
              <ItcInput
                type="number"
                min={1}
                value={maxResultadosConsulta}
                onChange={(e) => setMaxResultadosConsulta(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Valor mínimo</Label>
              <ItcInput
                type="text"
                inputMode="numeric"
                value={formatMilesInput(valorMinimo)}
                onChange={(e) => setValorMinimo(parseMilesInput(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Valor máximo</Label>
              <ItcInput
                type="text"
                inputMode="numeric"
                value={formatMilesInput(valorMaximo)}
                onChange={(e) => setValorMaximo(parseMilesInput(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Palabras clave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex gap-1.5">
            <ItcInput
              placeholder="Agregar palabra clave…"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <ItcButton type="button" variant="secondary" onClick={addKeyword}>
              Agregar
            </ItcButton>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <StatusBadge key={kw} tone="default">
                <span className="mr-1">{kw}</span>
                <button
                  type="button"
                  onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                  aria-label={`Quitar ${kw}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </StatusBadge>
            ))}
            {keywords.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin palabras clave todavía.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de catálogo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <CatalogPicker
            title="Códigos UNSPSC"
            items={unspscItems}
            selectedIds={unspscIds}
            onToggle={(id) => toggle(unspscIds, setUnspscIds, id)}
            emptyHint={
              <p className="p-2 text-xs text-muted-foreground">
                Sin códigos.{" "}
                <Link href="/admin/parametricas" className="text-primary hover:underline">
                  Ir a Códigos UNSPSC →
                </Link>
              </p>
            }
          />
          <CatalogPicker
            title="Estados SECOP"
            items={estadoSecopItems}
            selectedIds={estadoSecopIds}
            onToggle={(id) => toggle(estadoSecopIds, setEstadoSecopIds, id)}
            onQuickAdd={handleQuickAddEstadoSecop}
            onDelete={handleDeleteEstadoSecop}
            emptyHint={<p className="p-2 text-xs text-muted-foreground">Sin estados SECOP.</p>}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <ItcButton onClick={handleSave} disabled={isPending}>
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Guardando…" : "Guardar cambios"}
        </ItcButton>
      </div>
    </div>
  );
}
