"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ExternalLink, Search, Info } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput } from "@/components/itc";
import { DetalleProcesoModal } from "./detalle-proceso-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP, formatDate } from "@/lib/format";
import type { BuscarEnVivoRow } from "@/lib/secop-shared";
import { buscarEnVivoAction } from "./actions";

type Criterios = {
  dataset: string;
  entidad: string;
  nit: string;
  objeto: string;
  modalidad: string;
  estado: string;
  cuantiaMin: string;
  cuantiaMax: string;
};

/** Debe coincidir con el pageSize por defecto de BuscarSecopEnVivoUseCase. */
const PAGE_SIZE = 25;

const CRITERIOS_INICIALES: Criterios = {
  dataset: "secop_ii",
  entidad: "",
  nit: "",
  objeto: "",
  modalidad: "",
  estado: "",
  cuantiaMin: "",
  cuantiaMax: "",
};

export function BusquedaEnVivoView() {
  const [criterios, setCriterios] = useState<Criterios>(CRITERIOS_INICIALES);
  const [rows, setRows] = useState<BuscarEnVivoRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [buscada, setBuscada] = useState(false);
  const [detalleTarget, setDetalleTarget] = useState<BuscarEnVivoRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const ejecutarBusqueda = (paginaDestino: number) => {
    startTransition(async () => {
      try {
        const res = await buscarEnVivoAction({
          dataset: criterios.dataset,
          entidad: criterios.entidad.trim() || undefined,
          nit: criterios.nit.trim() || undefined,
          objeto: criterios.objeto.trim() || undefined,
          modalidad: criterios.modalidad.trim() || undefined,
          estado: criterios.estado.trim() || undefined,
          cuantiaMin: criterios.cuantiaMin ? Number(criterios.cuantiaMin) : undefined,
          cuantiaMax: criterios.cuantiaMax ? Number(criterios.cuantiaMax) : undefined,
          page: paginaDestino,
        });
        setRows(res.rows);
        setPage(res.page);
        setBuscada(true);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo completar la búsqueda en vivo",
        );
      }
    });
  };

  // tableLayout="fixed" + ancho por columna: el texto largo trunca con "…" en
  // vez de forzar scroll horizontal. "Proceso" (título) queda solo en el
  // modal de detalle, igual que en la tabla de Procesos detectados.
  const columns: TableColumn<BuscarEnVivoRow>[] = [
    {
      key: "entidad",
      title: "Entidad",
      width: "22%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.entidad ?? undefined}>
          {r.entidad ?? "—"}
        </span>
      ),
    },
    {
      key: "objeto",
      title: "Objeto",
      width: "27%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.objeto ?? undefined}>
          {r.objeto ?? "—"}
        </span>
      ),
    },
    {
      key: "modalidad",
      title: "Modalidad",
      width: "14%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.modalidad ?? undefined}>
          {r.modalidad ?? "—"}
        </span>
      ),
    },
    {
      key: "estado",
      title: "Estado",
      width: "12%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.estado ?? undefined}>
          {r.estado ?? "—"}
        </span>
      ),
    },
    {
      key: "valor",
      title: "Cuantía",
      width: "12%",
      align: "right",
      render: (r) => <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>,
    },
    {
      key: "fechaPublicacion",
      title: "Publicación",
      width: "9%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.fechaPublicacion)}</span>
      ),
    },
    {
      key: "acciones",
      title: "",
      width: 90,
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <ItcButton
            className="p-1.5 hover:bg-muted rounded"
            onClick={() => setDetalleTarget(r)}
            title="Ver detalle"
          >
            <Info className="h-3.5 w-3.5" />
          </ItcButton>
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded p-1.5 hover:bg-muted"
              title="Abrir en SECOP"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criterios de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-1.5">Fuente</Label>
            <Select
              value={criterios.dataset}
              onValueChange={(value) => setCriterios((c) => ({ ...c, dataset: value }))}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secop_i">SECOP I</SelectItem>
                <SelectItem value="secop_ii">SECOP II</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Entidad</Label>
            <ItcInput
              value={criterios.entidad}
              placeholder="Nombre de la entidad…"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, entidad: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5">NIT</Label>
            <ItcInput
              value={criterios.nit}
              placeholder="Identificador exacto…"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, nit: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5">Objeto</Label>
            <ItcInput
              value={criterios.objeto}
              placeholder="Palabras del objeto…"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, objeto: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5">Modalidad</Label>
            <ItcInput
              value={criterios.modalidad}
              placeholder="Coincidencia exacta…"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, modalidad: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5">Estado</Label>
            <ItcInput
              value={criterios.estado}
              placeholder="Coincidencia exacta…"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, estado: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5">Cuantía mínima</Label>
            <ItcInput
              type="number"
              value={criterios.cuantiaMin}
              placeholder="$0"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, cuantiaMin: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="mb-1.5">Cuantía máxima</Label>
            <ItcInput
              type="number"
              value={criterios.cuantiaMax}
              placeholder="Sin límite"
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setCriterios((c) => ({ ...c, cuantiaMax: e.target.value }))
              }
            />
          </div>

          <div className="flex items-end">
            <ItcButton
              type="button"
              onClick={() => ejecutarBusqueda(1)}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? <Spinner className="size-3.5" /> : <Search className="h-4 w-4" />}
              Buscar
            </ItcButton>
          </div>
        </CardContent>
      </Card>

      {!buscada ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Definí los criterios y presioná &quot;Buscar&quot; para consultar SECOP en tiempo real.
          Cada búsqueda consulta directamente a la plataforma oficial, así que hay un límite de
          frecuencia por organización.
        </div>
      ) : rows && rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin resultados para estos criterios.
        </div>
      ) : (
        rows && (
          <div className="space-y-3">
            <ItcTable
              data={rows}
              columns={columns}
              rowKey={(r) => r.secopId}
              pagination={false}
              tableLayout="fixed"
              striped
              hoverable
              stickyHeader
            />
            <div className="flex items-center justify-between">
              <ItcButton
                type="button"
                variant="secondary"
                disabled={page <= 1 || isPending}
                onClick={() => ejecutarBusqueda(page - 1)}
              >
                Anterior
              </ItcButton>
              <span className="text-sm text-muted-foreground">Página {page}</span>
              <ItcButton
                type="button"
                variant="secondary"
                disabled={rows.length < PAGE_SIZE || isPending}
                onClick={() => ejecutarBusqueda(page + 1)}
              >
                Siguiente
              </ItcButton>
            </div>
          </div>
        )
      )}

      <DetalleProcesoModal
        proceso={
          detalleTarget && {
            titulo: detalleTarget.titulo,
            secopId: detalleTarget.secopId,
            dataset: criterios.dataset,
            entidad: detalleTarget.entidad,
            objeto: detalleTarget.objeto,
            modalidad: detalleTarget.modalidad,
            estado: detalleTarget.estado,
            fase: detalleTarget.fase,
            valor: detalleTarget.valor,
            fechaPublicacion: detalleTarget.fechaPublicacion,
            fechaCierre: detalleTarget.fechaCierre,
            url: detalleTarget.url,
          }
        }
        onClose={() => setDetalleTarget(null)}
      />
    </div>
  );
}
