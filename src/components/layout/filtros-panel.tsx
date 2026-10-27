"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ItcButton, ItcDateRangePicker, ItcInput } from "@/components/itc";
import { SelectConOtro } from "@/app/(app)/secop/select-con-otro";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { formatCOP, formatMilesInput, parseMilesInput } from "@/lib/format";

export type OpcionFiltro = { value: string; label: string };

type CampoBase = { etiqueta: string; seccion: string };

export type CampoFiltro =
  | (CampoBase & {
      tipo: "select";
      clave: string;
      opciones: OpcionFiltro[];
      placeholderTodos?: string;
    })
  | (CampoBase & {
      tipo: "seleccion-libre";
      clave: string;
      opciones: string[];
      placeholderTodos: string;
    })
  | (CampoBase & { tipo: "texto"; clave: string; placeholder?: string })
  | (CampoBase & { tipo: "moneda"; clave: string; placeholder?: string })
  | (CampoBase & { tipo: "fechas"; claveDesde: string; claveHasta: string })
  | (CampoBase & { tipo: "switch"; clave: string });

/** Valores de los filtros por clave; "" significa "sin filtro". */
export type ValoresFiltro = Record<string, string>;

function clavesDe(campo: CampoFiltro): string[] {
  return campo.tipo === "fechas"
    ? [campo.claveDesde, campo.claveHasta]
    : [campo.clave];
}

function estaActivo(campo: CampoFiltro, valores: ValoresFiltro): boolean {
  return clavesDe(campo).some((k) => Boolean(valores[k]));
}

function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function textoChip(campo: CampoFiltro, valores: ValoresFiltro): string {
  switch (campo.tipo) {
    case "select": {
      const v = valores[campo.clave];
      const opcion = campo.opciones.find((o) => o.value === v);
      return `${campo.etiqueta}: ${opcion?.label ?? v}`;
    }
    case "moneda":
      return `${campo.etiqueta}: ${formatCOP(valores[campo.clave])}`;
    case "switch":
      return campo.etiqueta;
    case "fechas": {
      const desde = valores[campo.claveDesde];
      const hasta = valores[campo.claveHasta];
      const rango =
        desde && hasta
          ? `${fechaLegible(desde)} – ${fechaLegible(hasta)}`
          : desde
            ? `desde ${fechaLegible(desde)}`
            : `hasta ${fechaLegible(hasta)}`;
      return `${campo.etiqueta}: ${rango}`;
    }
    default:
      return `${campo.etiqueta}: ${valores[campo.clave]}`;
  }
}

function toIsoDate(d: Date | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

type ChangeEv = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

/**
 * Barra de filtros: buscador rápido + botón "Filtros (N)" que abre un panel
 * lateral con los filtros agrupados en secciones (acordeón), más una franja de
 * chips con los filtros aplicados y "Limpiar todos".
 *
 * Los cambios dentro del panel se acumulan en un borrador y solo se aplican al
 * pulsar "Aplicar filtros". Las vistas siguen siendo dueñas de la consulta:
 * reciben el conjunto completo de valores en `onAplicar`.
 */
export function FiltrosPanel({
  campos,
  valores,
  onAplicar,
  onQuitar,
  onLimpiar,
  buscador,
  acciones,
  deshabilitado = false,
  descripcion = "Ajusta los criterios para acotar los resultados.",
}: {
  campos: CampoFiltro[];
  /** Valores actualmente aplicados (los que reflejan la tabla). */
  valores: ValoresFiltro;
  /** Recibe el valor de todas las claves de `campos`. */
  onAplicar: (valores: ValoresFiltro) => void;
  /** Al quitar un chip. Por defecto reutiliza `onAplicar`. */
  onQuitar?: (valores: ValoresFiltro) => void;
  onLimpiar: () => void;
  /** Buscador rápido que se muestra a la izquierda del botón. */
  buscador?: ReactNode;
  /** Botones extra a la derecha del botón de filtros. */
  acciones?: ReactNode;
  deshabilitado?: boolean;
  descripcion?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<ValoresFiltro>(valores);

  const activos = campos.filter((c) => estaActivo(c, valores));
  const secciones = [...new Set(campos.map((c) => c.seccion))];

  const valoresCompletos = (base: ValoresFiltro): ValoresFiltro =>
    Object.fromEntries(
      campos.flatMap(clavesDe).map((k) => [k, base[k] ?? ""]),
    );

  const abrir = (value: boolean) => {
    if (value) setBorrador(valoresCompletos(valores));
    setAbierto(value);
  };

  const aplicarBorrador = () => {
    onAplicar(valoresCompletos(borrador));
    setAbierto(false);
  };

  const quitar = (campo: CampoFiltro) => {
    const next = valoresCompletos(valores);
    for (const k of clavesDe(campo)) next[k] = "";
    (onQuitar ?? onAplicar)(next);
  };

  const set = (clave: string, valor: string) =>
    setBorrador((b) => ({ ...b, [clave]: valor }));

  const renderCampo = (campo: CampoFiltro) => {
    switch (campo.tipo) {
      case "select":
        return (
          <div key={campo.clave}>
            <Label className="mb-1.5">{campo.etiqueta}</Label>
            <ItcInput
              type="select"
              value={borrador[campo.clave] ?? ""}
              onChange={(e: ChangeEv) => set(campo.clave, e.target.value)}
            >
              <option value="">{campo.placeholderTodos ?? "Todos"}</option>
              {campo.opciones.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </ItcInput>
          </div>
        );
      case "seleccion-libre":
        return (
          <SelectConOtro
            key={campo.clave}
            label={campo.etiqueta}
            value={borrador[campo.clave] ?? ""}
            opciones={campo.opciones}
            placeholderTodos={campo.placeholderTodos}
            onChange={(v) => set(campo.clave, v)}
          />
        );
      case "texto":
        return (
          <div key={campo.clave}>
            <Label className="mb-1.5">{campo.etiqueta}</Label>
            <ItcInput
              value={borrador[campo.clave] ?? ""}
              placeholder={campo.placeholder}
              onChange={(e: ChangeEv) => set(campo.clave, e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicarBorrador();
                }
              }}
            />
          </div>
        );
      case "moneda":
        return (
          <div key={campo.clave}>
            <Label className="mb-1.5">{campo.etiqueta}</Label>
            <ItcInput
              type="text"
              inputMode="numeric"
              value={formatMilesInput(borrador[campo.clave] ?? "")}
              placeholder={campo.placeholder}
              onChange={(e: ChangeEv) =>
                set(campo.clave, parseMilesInput(e.target.value))
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicarBorrador();
                }
              }}
            />
          </div>
        );
      case "fechas":
        return (
          <div key={campo.claveDesde}>
            <Label className="mb-1.5">{campo.etiqueta}</Label>
            <ItcDateRangePicker
              placeholder="Rango de fechas…"
              clearable
              value={
                borrador[campo.claveDesde] || borrador[campo.claveHasta]
                  ? {
                      from: fromIsoDate(borrador[campo.claveDesde]),
                      to: fromIsoDate(borrador[campo.claveHasta]),
                    }
                  : undefined
              }
              onChange={(range) =>
                setBorrador((b) => ({
                  ...b,
                  [campo.claveDesde]: toIsoDate(range?.from),
                  [campo.claveHasta]: toIsoDate(range?.to),
                }))
              }
            />
          </div>
        );
      case "switch":
        return (
          <label key={campo.clave} className="flex items-center gap-2 text-sm">
            <Switch
              checked={Boolean(borrador[campo.clave])}
              onCheckedChange={(checked) =>
                set(campo.clave, checked ? "1" : "")
              }
            />
            {campo.etiqueta}
          </label>
        );
    }
  };

  return (
    <div className="filtros-toolbar space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {buscador && <div className="min-w-52 max-w-md flex-1">{buscador}</div>}

        <Sheet open={abierto} onOpenChange={abrir}>
          <SheetTrigger asChild>
            <ItcButton type="button" variant="secondary" className="h-8 gap-1.5 px-2.5 text-xs">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activos.length > 0 && (
                <span
                  className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold leading-5 text-primary-foreground"
                  aria-label={`${activos.length} filtro${activos.length === 1 ? "" : "s"} activo${activos.length === 1 ? "" : "s"}`}
                >
                  {activos.length}
                </span>
              )}
            </ItcButton>
          </SheetTrigger>
          <SheetContent className="gap-0 p-0 sm:w-[26rem] sm:max-w-md">
            <div className="border-b px-6 py-4 pr-12">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>{descripcion}</SheetDescription>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <Accordion type="multiple" defaultValue={secciones}>
                {secciones.map((seccion) => (
                  <AccordionItem key={seccion} value={seccion}>
                    <AccordionTrigger>{seccion}</AccordionTrigger>
                    <AccordionContent
                      outerClassName="data-[state=open]:overflow-visible"
                      className="flex flex-col gap-4"
                    >
                      {campos
                        .filter((c) => c.seccion === seccion)
                        .map(renderCampo)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="flex gap-2 border-t bg-background px-6 py-4">
              <ItcButton
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  onLimpiar();
                  setAbierto(false);
                }}
                disabled={deshabilitado}
              >
                Restablecer
              </ItcButton>
              <ItcButton
                type="button"
                className="flex-1"
                onClick={aplicarBorrador}
                disabled={deshabilitado}
              >
                Aplicar filtros
              </ItcButton>
            </div>
          </SheetContent>
        </Sheet>

        {acciones}
      </div>

      {activos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros aplicados:</span>
          {activos.map((campo) => (
            <span
              key={clavesDe(campo)[0]}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/70 px-2 py-0.5 text-[11px]"
            >
              {textoChip(campo, valores)}
              <button
                type="button"
                className="cursor-pointer rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Quitar filtro ${campo.etiqueta}`}
                onClick={() => quitar(campo)}
                disabled={deshabilitado}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="cursor-pointer text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onLimpiar}
            disabled={deshabilitado}
          >
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
}
