"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ItcButton, ItcTable, type TableColumn } from "@/components/itc";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { Label } from "@/components/ui/label";
import type { ApiSchemas } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import {
  aplicarCarga,
  descartarCarga,
  previsualizarCarga,
  type CargaConocimiento,
  type EstadoConocimiento,
  type VistaPreviaConocimiento,
} from "./actions";

type EmpresaActual = ApiSchemas["EmpresaConocimientoResult"];
type ResumenEmpresa = ApiSchemas["ResumenEmpresaCarga"];
type Indicador = ApiSchemas["IndicadorResumen"];
type Historial = ApiSchemas["CargaHistorialResult"];

const ESTADO_CARGA: Record<string, { label: string; tone: Tone }> = {
  pendiente: { label: "Pendiente de aplicar", tone: "info" },
  con_errores: { label: "Con errores", tone: "danger" },
  aplicada: { label: "Aplicada", tone: "success" },
  descartada: { label: "Descartada", tone: "muted" },
};

const PARTE: Record<string, string> = {
  indicadores: "Indicadores",
  perfil: "Perfil y RUP",
  contratos: "Experiencia",
};

const numero = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));
const decimal = (v: number | string | null | undefined, decimales = 3) =>
  numero(v) === null ? "—" : numero(v)!.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: decimales });

export function ConocimientoLicitacionesView({ estado }: { estado: EstadoConocimiento }) {
  const archivosRef = useRef<HTMLInputElement>(null);
  const [carga, setCarga] = useState<CargaConocimiento | null>(null);
  const [isPending, startTransition] = useTransition();

  const validar = () => {
    const seleccionados = archivosRef.current?.files;
    if (!seleccionados || seleccionados.length === 0) {
      toast.error("Selecciona los documentos que vas a cargar.");
      return;
    }
    const fd = new FormData();
    for (const archivo of Array.from(seleccionados)) fd.append("archivos", archivo);

    startTransition(async () => {
      try {
        const resultado = await previsualizarCarga(fd);
        setCarga(resultado);
        if (resultado.vistaPrevia.empresas.length > 0 && resultado.estado === "pendiente") {
          toast.success("Documentos validados: revisa la vista previa y aplica la carga.");
        } else {
          toast.warning("La carga tiene errores: corrígelos y vuelve a subir los documentos.");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudieron procesar los documentos");
      }
    });
  };

  const aplicar = () => {
    if (!carga) return;
    startTransition(async () => {
      try {
        await aplicarCarga(carga.cargaId);
        toast.success("Base de conocimiento actualizada: el próximo análisis usa estos datos.");
        setCarga(null);
        if (archivosRef.current) archivosRef.current.value = "";
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo aplicar la carga");
      }
    });
  };

  const descartar = () => {
    if (!carga) return;
    startTransition(async () => {
      try {
        await descartarCarga(carga.cargaId);
        setCarga(null);
        if (archivosRef.current) archivosRef.current.value = "";
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo descartar la carga");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        {estado.empresas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay datos cargados: descarga la plantilla, llena sus tres hojas y súbela.
          </p>
        ) : (
          estado.empresas.map((e) => <TarjetaEmpresa key={e.clave} empresa={e} />)
        )}
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">Cargar documentos</h3>
          <ItcButton variant="secondary" size="sm" href="/api/conocimiento-licitaciones/plantilla">
            Descargar plantilla (con los datos actuales)
          </ItcButton>
        </div>
        <p className="text-sm text-muted-foreground">
          Descarga la plantilla de Excel, corrige o agrega filas en las hojas Empresas, Indicadores y Contratos, y
          súbela. Las columnas se leen por su título, así que no los cambies. Si una hoja trae filas de una empresa,
          reemplaza esos datos; lo que no venga se conserva. También se aceptan los Word de indicadores, información
          corporativa y experiencia: cada archivo se reconoce por su contenido, no por su nombre. Todo se valida
          antes de aplicarlo y se guarda una copia en SharePoint.
        </p>
        <div>
          <Label className="mb-1.5">Plantilla (.xlsx) o documentos (.docx)</Label>
          <input
            ref={archivosRef}
            type="file"
            multiple
            accept=".docx,.xlsx"
            disabled={isPending}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
        <ItcButton onClick={validar} loading={isPending} disabled={isPending}>
          Validar documentos
        </ItcButton>
      </section>

      {carga && (
        <VistaPrevia
          vista={carga.vistaPrevia}
          estado={carga.estado}
          ocupado={isPending}
          onAplicar={aplicar}
          onDescartar={descartar}
        />
      )}

      <Historial cargas={estado.cargas} />
    </div>
  );
}

function TarjetaEmpresa({ empresa }: { empresa: EmpresaActual }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div>
        <h3 className="text-sm font-semibold">{empresa.razonSocial}</h3>
        <p className="text-xs text-muted-foreground">
          NIT {empresa.nit} · {empresa.tamano ?? "—"} · RUP {empresa.rupNumero ?? "—"} vigente hasta{" "}
          {empresa.rupVigenteHasta ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          Actualizado {empresa.actualizadoEn ? formatDate(empresa.actualizadoEn) : "—"}
        </p>
      </div>
      <p className="text-sm">
        <span className="font-medium">{empresa.contratos}</span> contratos ·{" "}
        <span className="font-medium">{decimal(empresa.smmlvTotal, 2)}</span> SMMLV acumulados
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {empresa.indicadores.map((i) => (
          <div key={i.nombre} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{i.nombre}</dt>
            <dd className="font-medium">{decimal(i.valor)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function VistaPrevia({
  vista,
  estado,
  ocupado,
  onAplicar,
  onDescartar,
}: {
  vista: VistaPreviaConocimiento;
  estado: string;
  ocupado: boolean;
  onAplicar: () => void;
  onDescartar: () => void;
}) {
  const puedeAplicar = estado === "pendiente";
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Vista previa</h3>
          <StatusBadge tone={ESTADO_CARGA[estado]?.tone ?? "muted"}>{ESTADO_CARGA[estado]?.label ?? estado}</StatusBadge>
        </div>
        <div className="flex gap-2">
          <ItcButton variant="secondary" onClick={onDescartar} disabled={ocupado}>
            Descartar
          </ItcButton>
          <ItcButton onClick={onAplicar} loading={ocupado} disabled={ocupado || !puedeAplicar}>
            Aplicar carga
          </ItcButton>
        </div>
      </div>

      {vista.errores.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {vista.errores.map((e) => (
            <li key={e}>✘ {e}</li>
          ))}
        </ul>
      )}

      <ul className="space-y-1 text-sm">
        {vista.archivos.map((a) => (
          <li key={a.nombre} className="flex flex-wrap gap-2">
            <span className={a.nota ? "text-muted-foreground" : ""}>{a.nota ? "–" : "✔"} {a.nombre}</span>
            {a.nota && <span className="text-xs text-muted-foreground">{a.nota}</span>}
          </li>
        ))}
      </ul>

      {vista.empresas.map((e) => (
        <ResumenEmpresaCarga key={e.clave} resumen={e} />
      ))}
    </section>
  );
}

function ResumenEmpresaCarga({ resumen }: { resumen: ResumenEmpresa }) {
  const c = resumen.contratos;
  const columns: TableColumn<Indicador>[] = [
    { key: "nombre", title: "Indicador", width: "34%", render: (i) => <span className="text-sm">{i.nombre}</span> },
    { key: "calculado", title: "Calculado", width: "18%", render: (i) => <span className="text-sm font-medium">{decimal(i.calculado)}</span> },
    { key: "documento", title: "Archivo 04", width: "18%", render: (i) => <span className="text-sm">{decimal(i.documento)}</span> },
    { key: "anterior", title: "Antes", width: "18%", render: (i) => <span className="text-sm text-muted-foreground">{decimal(i.anterior)}</span> },
    { key: "coincide", title: "", width: "12%", render: (i) => (i.coincide ? "✔" : <span className="text-destructive">✘</span>) },
  ];

  return (
    <div className="space-y-3 rounded-lg bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold">{resumen.razonSocial}</h4>
        {resumen.partes.map((p) => (
          <StatusBadge key={p} tone="info">
            {PARTE[p] ?? p}
          </StatusBadge>
        ))}
      </div>

      {resumen.errores.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {resumen.errores.map((e) => (
            <li key={e}>✘ {e}</li>
          ))}
        </ul>
      )}
      {resumen.avisos.length > 0 && (
        <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
          {resumen.avisos.map((a) => (
            <li key={a}>⚠️ {a}</li>
          ))}
        </ul>
      )}

      {c && (
        <div className="space-y-1 text-sm">
          <p>
            Contratos leídos: <span className="font-medium">{c.leidos}</span> de {c.declarados ?? "—"} declarados (antes{" "}
            {c.anteriores}) · {decimal(c.smmlvTotal, 2)} SMMLV · {c.unspscCompletados} listas de códigos completadas desde
            la hoja
          </p>
          {c.nuevos.length > 0 && <p className="text-emerald-700 dark:text-emerald-400">Nuevos: {c.nuevos.join("; ")}</p>}
          {c.retirados.length > 0 && <p className="text-amber-700 dark:text-amber-400">Retirados: {c.retirados.join("; ")}</p>}
        </div>
      )}

      {resumen.perfil && (
        <p className="text-sm text-muted-foreground">
          {resumen.perfil.tamano ?? "—"} · RUP {resumen.perfil.rupNumero ?? "—"} vigente hasta{" "}
          {resumen.perfil.rupVigenteHasta ?? "—"} · Personas con discapacidad vinculadas:{" "}
          {resumen.perfil.discapacidadVinculadas}
        </p>
      )}

      {resumen.indicadores.length > 0 && (
        <ItcTable
          data={resumen.indicadores}
          columns={columns}
          rowKey={(i) => i.nombre}
          pagination={false}
          tableLayout="fixed"
          responsiveStrategy="cards"
          striped
        />
      )}
    </div>
  );
}

function Historial({ cargas }: { cargas: Historial[] }) {
  if (cargas.length === 0) return null;
  const columns: TableColumn<Historial>[] = [
    { key: "creadoEn", title: "Fecha", width: "16%", render: (c) => <span className="text-sm">{formatDate(c.creadoEn)}</span> },
    {
      key: "estado",
      title: "Estado",
      width: "16%",
      render: (c) => <StatusBadge tone={ESTADO_CARGA[c.estado]?.tone ?? "muted"}>{ESTADO_CARGA[c.estado]?.label ?? c.estado}</StatusBadge>,
    },
    {
      key: "personas",
      title: "Cargó / aplicó",
      width: "20%",
      render: (c) => (
        <span className="text-sm">
          {c.creadoPor ?? "—"}
          {c.aplicadoPor && <span className="text-muted-foreground"> · aplicó {c.aplicadoPor}</span>}
        </span>
      ),
    },
    {
      key: "archivos",
      title: "Documentos",
      width: "48%",
      render: (c) => <span className="block truncate text-xs text-muted-foreground" title={c.archivos.join(", ")}>{c.archivos.join(", ")}</span>,
    },
  ];
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Historial de cargas</h3>
      <ItcTable
        data={cargas}
        columns={columns}
        rowKey={(c) => c.id}
        pagination={false}
        tableLayout="fixed"
        responsiveStrategy="cards"
        striped
      />
    </section>
  );
}
