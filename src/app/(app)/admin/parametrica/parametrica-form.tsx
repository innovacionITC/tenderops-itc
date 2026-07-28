"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/layout/status-badge";
import Link from "next/link";
import type { ParametricaConfig, CatalogItem } from "@/lib/parametrica";
import { CIUDAD_SEARCH_LIMIT } from "@/lib/parametrica-shared";
import type { UnspscRow } from "@/lib/unspsc";
import { CatalogPicker, type PickerItem } from "./catalog-picker";
import { AsyncCatalogPicker } from "./async-catalog-picker";
import { quickAddEstadoSecop, saveParametricaConfig, searchCiudadesParametrica } from "./actions";

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
    nits: CatalogItem[];
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

  const modalidadItems = toPickerItems(catalogs.modalidades);
  const entidadItems = toPickerItems(catalogs.entidades);
  const [estadoItems, setEstadoItems] = useState(toPickerItems(catalogs.estadosSecop));
  const unspscItems: PickerItem[] = catalogs.unspscCodes.map((c) => ({
    id: c.id,
    label: c.descripcion ? `${c.codigo} — ${c.descripcion}` : c.codigo,
  }));
  const nitItems = toPickerItems(catalogs.nits);
  const departamentoItems = toPickerItems(catalogs.departamentos);

  const [modalidadIds, setModalidadIds] = useState(new Set(config?.modalidadIds ?? []));
  const [entidadIds, setEntidadIds] = useState(new Set(config?.entidadIds ?? []));
  const [estadoSecopIds, setEstadoSecopIds] = useState(new Set(config?.estadoSecopIds ?? []));
  const [unspscIds, setUnspscIds] = useState(new Set<string>());
  const [nitIds, setNitIds] = useState(new Set(config?.nitIds ?? []));
  const [departamentoIds, setDepartamentoIds] = useState(new Set(config?.departamentoIds ?? []));
  // Ciudades guarda items completos (id + label): el catálogo no está en el
  // cliente, así que el label de cada selección debe conservarse aquí.
  const [ciudades, setCiudades] = useState<PickerItem[]>(toPickerItems(ciudadesSeleccionadas));

  const toggleCiudad = (item: PickerItem) => {
    setCiudades((prev) =>
      prev.some((c) => c.id === item.id) ? prev.filter((c) => c.id !== item.id) : [...prev, item],
    );
  };

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
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
          nitIds: Array.from(nitIds),
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
              <Input
                type="number"
                min={1}
                value={diasHaciaAtras}
                onChange={(e) => setDiasHaciaAtras(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Intervalo cron (min)</Label>
              <Input
                type="number"
                min={1}
                value={intervalosCronMin}
                onChange={(e) => setIntervalosCronMin(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Máx. resultados</Label>
              <Input
                type="number"
                min={1}
                value={maxResultadosConsulta}
                onChange={(e) => setMaxResultadosConsulta(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1.5">Valor mínimo</Label>
              <Input
                type="number"
                value={valorMinimo}
                onChange={(e) => setValorMinimo(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Valor máximo</Label>
              <Input
                type="number"
                value={valorMaximo}
                onChange={(e) => setValorMaximo(e.target.value)}
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
            <Input
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
            <Button type="button" variant="outline" onClick={addKeyword}>
              Agregar
            </Button>
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
            title="Modalidades"
            items={modalidadItems}
            selectedIds={modalidadIds}
            onToggle={(id) => toggle(modalidadIds, setModalidadIds, id)}
            emptyHint={
              <p className="p-2 text-xs text-muted-foreground">
                Sin modalidades.{" "}
                <Link href="/admin/modalidades" className="text-primary hover:underline">
                  Ir a Modalidades →
                </Link>
              </p>
            }
          />
          <CatalogPicker
            title="Entidades"
            items={entidadItems}
            selectedIds={entidadIds}
            onToggle={(id) => toggle(entidadIds, setEntidadIds, id)}
            emptyHint={
              <p className="p-2 text-xs text-muted-foreground">
                Sin entidades.{" "}
                <Link href="/admin/entidades" className="text-primary hover:underline">
                  Ir a Entidades →
                </Link>
              </p>
            }
          />
          <CatalogPicker
            title="Estados SECOP"
            items={estadoItems}
            selectedIds={estadoSecopIds}
            onToggle={(id) => toggle(estadoSecopIds, setEstadoSecopIds, id)}
            onQuickAdd={async (label) => quickAddEstadoSecop({ nombre: label })}
            onItemCreated={(item) => setEstadoItems((prev) => [...prev, item])}
          />
          <CatalogPicker
            title="Códigos UNSPSC"
            items={unspscItems}
            selectedIds={unspscIds}
            onToggle={(id) => toggle(unspscIds, setUnspscIds, id)}
            emptyHint={
              <p className="p-2 text-xs text-muted-foreground">
                Sin códigos.{" "}
                <Link href="/admin/unspsc" className="text-primary hover:underline">
                  Ir a Códigos UNSPSC →
                </Link>
              </p>
            }
          />
          <CatalogPicker
            title="NITs"
            items={nitItems}
            selectedIds={nitIds}
            onToggle={(id) => toggle(nitIds, setNitIds, id)}
            emptyHint={
              <p className="p-2 text-xs text-muted-foreground">
                Sin NITs.{" "}
                <Link href="/admin/nits" className="text-primary hover:underline">
                  Ir a NITs →
                </Link>
              </p>
            }
          />
          <CatalogPicker
            title="Departamentos"
            items={departamentoItems}
            selectedIds={departamentoIds}
            onToggle={(id) => toggle(departamentoIds, setDepartamentoIds, id)}
            emptyHint={
              <p className="p-2 text-xs text-muted-foreground">
                Sin departamentos.{" "}
                <Link href="/admin/departamentos" className="text-primary hover:underline">
                  Ir a Departamentos →
                </Link>
              </p>
            }
          />
          <AsyncCatalogPicker
            title="Ciudades"
            selected={ciudades}
            onToggle={toggleCiudad}
            search={searchCiudadesParametrica}
            placeholder="Buscar ciudad…"
            resultLimit={CIUDAD_SEARCH_LIMIT}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Spinner className="size-3.5" />}
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
