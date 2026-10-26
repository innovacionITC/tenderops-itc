"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ItcButton, ItcModal, ItcTable, type TableColumn } from "@/components/itc";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import type { ApiSchemas } from "@/lib/api/types";
import {
  getEvidenciaAnalisis,
  getInformeAnalisis,
  type EvidenciaCitada,
  type ResultadoAnalisis,
} from "./analisis-ia-actions";

type FilaRequisito = ApiSchemas["FilaRequisito"];
type FilaFinanciera = ApiSchemas["FilaFinanciera"];
type FilaCalificacion = ApiSchemas["FilaCalificacion"];
type FilaCronograma = ApiSchemas["FilaCronograma"];
type AccionBrecha = ApiSchemas["AccionBrecha"];
type CategoriaSemaforo = ApiSchemas["CategoriaSemaforo"];
type EstadoNota = ApiSchemas["EstadoNota"];

// Leyenda obligatoria del Playbook v2.0.
const ESTADO: Record<string, { tone: Tone; label: string }> = {
  VERDE: { tone: "success", label: "Verde" },
  AZUL: { tone: "info", label: "Azul" },
  AMARILLO: { tone: "warning", label: "Amarillo" },
  ROJO: { tone: "danger", label: "Rojo" },
};

const URGENCIA: Record<string, Tone> = { ROJA: "danger", AMARILLA: "warning", VERDE: "success" };

const FIGURA: Record<string, string> = {
  XRM: "xRM Services individual",
  INTELECTO: "Intelecto SAS individual",
  AMBAS_XRM_PREFERENTE: "xRM Services (Intelecto también cumple)",
  CONSORCIO_UT: "Consorcio o unión temporal xRM + Intelecto",
  NO_PARTICIPAR: "No participar",
};

const RESULTADO: Record<string, { tone: Tone; label: string }> = {
  COMPLETADO: { tone: "success", label: "Completado" },
  PROVISIONAL: { tone: "warning", label: "Provisional" },
  REQUIERE_REVISION: { tone: "warning", label: "Requiere revisión" },
};

const SUBSANABILIDAD: Record<string, string> = {
  insubsanable: "Insubsanable",
  subsanable_antes_del_cierre: "Subsanable antes del cierre",
  subsanable_hasta_traslado: "Subsanable hasta el traslado",
  solo_aclaracion: "Solo aclaración",
  verificacion_directa: "Verificación directa",
};

const numero = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));
const cop = (v: number | string | null | undefined) =>
  numero(v) === null ? null : `$ ${numero(v)!.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

export function ResultadoAnalisisLicitacion({ procesoId, resultado }: { procesoId: string; resultado: ResultadoAnalisis }) {
  const [evidencia, setEvidencia] = useState<EvidenciaCitada | null>(null);
  const [cargando, startTransition] = useTransition();

  const verEvidencia = (evidenceId: string) => {
    startTransition(async () => {
      try {
        setEvidencia(await getEvidenciaAnalisis(procesoId, evidenceId));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo abrir la evidencia");
      }
    });
  };

  const descargar = (nombre: string, contenido: string, tipo: string) => {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarInforme = () => {
    startTransition(async () => {
      try {
        const informe = await getInformeAnalisis(procesoId);
        if (informe) descargar(`informe-v${resultado.version}.md`, informe, "text/markdown");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo descargar el informe");
      }
    });
  };

  const citas = (ids: string[]) => <Citas ids={ids} onVer={verEvidencia} />;
  const p0 = resultado.paso0LecturaIntegral;
  const figura = resultado.paso1Semaforo.figura;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{resultado.titulo}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={RESULTADO[resultado.estadoResultado]?.tone ?? "muted"}>
              {RESULTADO[resultado.estadoResultado]?.label ?? resultado.estadoResultado}
            </StatusBadge>
            <span className="text-xs text-muted-foreground">
              Versión {resultado.version} · Playbook {resultado.metodologia.version} · {formatDate(resultado.generadoEn)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{resultado.avisoLegal}</p>
        </div>
        <div className="flex gap-2">
          <ItcButton variant="secondary" size="sm" onClick={descargarInforme} loading={cargando}>
            Descargar informe
          </ItcButton>
          <ItcButton
            variant="secondary"
            size="sm"
            onClick={() => descargar(`resultado-v${resultado.version}.json`, JSON.stringify(resultado, null, 2), "application/json")}
          >
            Descargar JSON
          </ItcButton>
        </div>
      </div>

      {p0.avisos.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          {p0.avisos.map((a) => (
            <li key={a}>⚠️ {a}</li>
          ))}
        </ul>
      )}

      <Seccion titulo="PASO 0 — Lectura integral del proceso">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Dato titulo="Número del proceso">{p0.numeroProceso}</Dato>
          <Dato titulo="Entidad">{p0.entidad}</Dato>
          <Dato titulo="Objeto" ancho>{p0.objeto}</Dato>
          <Dato titulo="Modalidad">{p0.modalidad}</Dato>
          <Dato titulo="Presupuesto oficial">
            {cop(p0.presupuesto.cop)}
            {numero(p0.presupuesto.smmlv) !== null && ` (${numero(p0.presupuesto.smmlv)!.toLocaleString("es-CO")} SMMLV)`}
          </Dato>
          <Dato titulo="Plazo de ejecución">{p0.plazo}</Dato>
          <Dato titulo="Cierre">{p0.cierre}</Dato>
          <Dato titulo="Estado del documento">{p0.estadoDocumento}</Dato>
          <Dato titulo="Proponente plural">
            {p0.pluralPermitido === true ? "Permitido" : p0.pluralPermitido === false ? "No permitido" : null}
          </Dato>
          <Dato titulo="Lotes">{p0.lotes.length > 0 ? p0.lotes.join(", ") : null}</Dato>
          <Dato titulo="Cobertura">
            {`${Math.round((numero(p0.cobertura.documentos) ?? 0) * 100)} % de documentos · ${p0.cobertura.chunksLeidosIa} de ${p0.cobertura.chunksTotales} fragmentos leídos`}
          </Dato>
        </dl>
        <div className="mt-2">{citas(p0.evidenceIds)}</div>
      </Seccion>

      <Seccion titulo="PASO 1 — Semáforo comparativo y figura recomendada">
        <Semaforo categorias={resultado.paso1Semaforo.categorias} />
        <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Figura recomendada: {FIGURA[figura.recomendacion] ?? figura.recomendacion}</span>
            {figura.provisional && <StatusBadge tone="warning">Provisional</StatusBadge>}
          </div>
          <p className="text-sm">{figura.justificacion}</p>
          {figura.porcentajesSugeridos && (
            <p className="text-sm">
              Participación sugerida de xRM: entre {figura.porcentajesSugeridos.xrmMinimo} % y {figura.porcentajesSugeridos.xrmMaximo} % (
              {figura.porcentajesSugeridos.metodologia}).
            </p>
          )}
          <ul className="space-y-1 text-sm">
            {figura.alternativas.map((a) => (
              <li key={a.figura} className="flex flex-wrap items-center gap-2">
                <Estado estado={a.estado} />
                <span>{FIGURA[a.figura] ?? a.figura}:</span>
                <span className="text-muted-foreground">{a.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      <Seccion titulo="PASO 2 — Criterios de calificación">
        <Calificacion filas={resultado.paso2Calificacion} citas={citas} />
      </Seccion>

      <Seccion titulo="PASO 3 — Habilitantes jurídicos">
        <Requisitos filas={resultado.paso3Juridico} citas={citas} />
      </Seccion>

      <Seccion titulo="PASO 4 — Habilitantes financieros">
        <Financiero filas={resultado.paso4Financiero} citas={citas} />
      </Seccion>

      <Seccion titulo="PASO 5 — Habilitantes técnicos">
        <Requisitos filas={resultado.paso5Tecnico} citas={citas} />
      </Seccion>

      <Seccion titulo="PASO 6 — Cronograma crítico">
        {resultado.paso6Cronograma.siguienteHitoCritico && (
          <p className="mb-2 text-sm">
            Siguiente hito crítico: <span className="font-medium">{resultado.paso6Cronograma.siguienteHitoCritico}</span>
          </p>
        )}
        <Cronograma filas={resultado.paso6Cronograma.hitos} citas={citas} />
      </Seccion>

      {resultado.causalesRechazo.length > 0 && (
        <Seccion titulo="Causales de rechazo identificadas">
          <ul className="space-y-2 text-sm">
            {resultado.causalesRechazo.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-2">
                <span>
                  {c.numeral && <span className="font-medium">{c.numeral} </span>}
                  {c.descripcion}
                </span>
                {citas(c.evidenceIds)}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="PASO 7 — Acciones y brechas">
        <Acciones filas={resultado.paso7Acciones} citas={citas} />
      </Seccion>

      <Seccion titulo="Control de calidad">
        <ul className="space-y-1 text-sm">
          {resultado.controlesCalidad.map((c) => (
            <li key={c.control}>
              {c.resultado === "aprobado" ? "✔" : c.resultado === "advertido" ? "⚠️" : "✘"} {c.control}
              {c.bloqueante && <span className="text-xs text-muted-foreground"> (bloqueante)</span>}
              {c.detalle && <span className="text-muted-foreground">: {c.detalle}</span>}
            </li>
          ))}
        </ul>
        {resultado.limitaciones.length > 0 && (
          <div className="mt-3 space-y-1">
            <h5 className="text-xs font-medium text-muted-foreground">Limitaciones</h5>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {resultado.limitaciones.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      <ItcModal
        open={evidencia !== null}
        onClose={() => setEvidencia(null)}
        title={evidencia ? `Evidencia ${evidencia.evidenceId}` : "Evidencia"}
        size="lg"
        content={
          evidencia && (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">{evidencia.documento ?? "Documento"}</span>
                {evidencia.paginas.length > 0 && ` · pág. ${evidencia.paginas.join(", ")}`}
              </p>
              <p className="text-xs text-muted-foreground">{evidencia.seccion}</p>
              {numero(evidencia.confianza) !== null && (
                <StatusBadge tone={numero(evidencia.confianza)! < 0.8 ? "warning" : "muted"}>
                  Leído con OCR · confianza {Math.round(numero(evidencia.confianza)! * 100)} %
                </StatusBadge>
              )}
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">{evidencia.texto}</pre>
            </div>
          )
        }
      />
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h4 className="text-sm font-semibold">{titulo}</h4>
      {children}
    </section>
  );
}

function Dato({ titulo, ancho, children }: { titulo: string; ancho?: boolean; children: React.ReactNode }) {
  return (
    <div className={ancho ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd>{children || <span className="text-muted-foreground">No disponible</span>}</dd>
    </div>
  );
}

function Estado({ estado }: { estado: string }) {
  const e = ESTADO[estado];
  return <StatusBadge tone={e?.tone ?? "muted"}>{e?.label ?? estado}</StatusBadge>;
}

function EstadoDetalle({ estado, detalle }: { estado: string; detalle: string }) {
  return (
    <div className="space-y-1">
      <Estado estado={estado} />
      <p className="text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}

// Cada cita abre el fragmento del expediente que la respalda.
function Citas({ ids, onVer }: { ids: string[]; onVer: (id: string) => void }) {
  if (ids.length === 0) return <span className="text-xs text-amber-700 dark:text-amber-400">⚠️ Evidencia insuficiente</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.slice(0, 4).map((id) => (
        <ItcButton key={id} variant="link" size="xs" onClick={() => onVer(id)}>
          {id.split("-").slice(-2).join("-")}
        </ItcButton>
      ))}
      {ids.length > 4 && <span className="text-xs text-muted-foreground">+{ids.length - 4}</span>}
    </span>
  );
}

type Citador = (ids: string[]) => React.ReactNode;

function Semaforo({ categorias }: { categorias: CategoriaSemaforo[] }) {
  const plural = categorias.some((c) => c.plural);
  const celda = (e: EstadoNota | null | undefined) => (e ? <EstadoDetalle estado={e.estado} detalle={e.nota} /> : "—");
  const columns: TableColumn<CategoriaSemaforo>[] = [
    { key: "categoria", title: "Categoría", width: "18%", render: (c) => <span className="text-sm font-medium">{c.categoria}</span> },
    { key: "xrm", title: "xRM Services", width: plural ? "22%" : "30%", render: (c) => celda(c.xrm) },
    { key: "intelecto", title: "Intelecto SAS", width: plural ? "22%" : "30%", render: (c) => celda(c.intelecto) },
    ...(plural ? [{ key: "plural", title: "Consorcio / UT", width: "18%", render: (c: CategoriaSemaforo) => celda(c.plural) }] : []),
    { key: "comentario", title: "Comentario", width: plural ? "20%" : "22%", render: (c) => <span className="text-xs">{c.comentario}</span> },
  ];
  return <Tabla data={categorias} columns={columns} rowKey={(c) => c.categoria} />;
}

function Calificacion({ filas, citas }: { filas: FilaCalificacion[]; citas: Citador }) {
  if (filas.length === 0) return <Vacio texto="⚠️ No se identificaron criterios de puntaje en el expediente." />;
  const columns: TableColumn<FilaCalificacion>[] = [
    { key: "criterio", title: "Criterio", width: "22%", render: (c) => <span className="text-sm">{c.numeral && `${c.numeral} `}{c.criterio}</span> },
    { key: "puntos", title: "Puntos", width: "8%", render: (c) => <span className="text-sm">{c.puntosTexto ?? "—"}</span> },
    { key: "regla", title: "Regla / soporte", width: "26%", render: (c) => <span className="text-xs">{c.regla}{c.soporte && ` · Soporte: ${c.soporte}`}</span> },
    { key: "xrm", title: "xRM", width: "15%", render: (c) => <EstadoDetalle estado={c.xrm.estado} detalle={c.xrm.nota} /> },
    { key: "intelecto", title: "Intelecto", width: "15%", render: (c) => <EstadoDetalle estado={c.intelecto.estado} detalle={c.intelecto.nota} /> },
    { key: "fuente", title: "Fuente", width: "14%", render: (c) => citas(c.evidenceIds) },
  ];
  return <Tabla data={filas} columns={columns} rowKey={(c) => `${c.numeral}-${c.criterio}`} />;
}

function Requisitos({ filas, citas }: { filas: FilaRequisito[]; citas: Citador }) {
  if (filas.length === 0) return <Vacio texto="No se identificaron requisitos en esta categoría." />;
  const columns: TableColumn<FilaRequisito>[] = [
    {
      key: "requisito",
      title: "Requisito",
      width: "28%",
      render: (r) => (
        <div className="space-y-1 text-sm">
          <span>{r.numeral && <span className="font-medium">{r.numeral} </span>}{r.requisito}</span>
          {r.avisos.length > 0 && <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ {r.avisos.join(" ")}</p>}
        </div>
      ),
    },
    { key: "tipo", title: "Tipo", width: "9%", render: (r) => <span className="text-xs">{r.tipo}</span> },
    { key: "xrm", title: "xRM", width: "22%", render: (r) => <EstadoDetalle estado={r.xrm.estado} detalle={r.xrm.detalle} /> },
    { key: "intelecto", title: "Intelecto", width: "22%", render: (r) => <EstadoDetalle estado={r.intelecto.estado} detalle={r.intelecto.detalle} /> },
    {
      key: "fuente",
      title: "Fuente",
      width: "19%",
      render: (r) => (
        <div className="space-y-1">
          {citas(r.evidenceIds)}
          {r.subsanabilidad && <p className="text-xs text-muted-foreground">{SUBSANABILIDAD[r.subsanabilidad] ?? r.subsanabilidad}</p>}
        </div>
      ),
    },
  ];
  return <Tabla data={filas} columns={columns} rowKey={(r) => r.id} />;
}

function Financiero({ filas, citas }: { filas: FilaFinanciera[]; citas: Citador }) {
  if (filas.length === 0) return <Vacio texto="No se identificaron indicadores financieros exigidos." />;
  const valor = (v: FilaFinanciera["xrm"]) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{v.resultado ?? "—"}</span>
        <Estado estado={v.estado} />
      </div>
      <p className="text-xs text-muted-foreground">{v.detalle}</p>
    </div>
  );
  const columns: TableColumn<FilaFinanciera>[] = [
    { key: "indicador", title: "Indicador", width: "18%", render: (f) => <span className="text-sm">{f.indicador}</span> },
    { key: "formula", title: "Fórmula", width: "16%", render: (f) => <span className="text-xs">{f.formula ?? "—"}</span> },
    { key: "umbral", title: "Umbral", width: "10%", render: (f) => <span className="text-sm">{f.umbral ?? "—"}</span> },
    { key: "xrm", title: "xRM", width: "22%", render: (f) => valor(f.xrm) },
    { key: "intelecto", title: "Intelecto", width: "22%", render: (f) => valor(f.intelecto) },
    { key: "fuente", title: "Fuente", width: "12%", render: (f) => citas(f.evidenceIds) },
  ];
  return <Tabla data={filas} columns={columns} rowKey={(f) => f.id} />;
}

function Cronograma({ filas, citas }: { filas: FilaCronograma[]; citas: Citador }) {
  if (filas.length === 0) return <Vacio texto="⚠️ No se identificó el cronograma en el expediente." />;
  const columns: TableColumn<FilaCronograma>[] = [
    { key: "hito", title: "Hito", width: "30%", render: (h) => <span className={`text-sm ${h.critico ? "font-medium" : ""}`}>{h.hito}</span> },
    {
      key: "fecha",
      title: "Fecha / hora",
      width: "18%",
      render: (h) => <span className="text-sm">{h.fechaHora ?? "Sin fecha"}{h.incierto && " ⚠️"}</span>,
    },
    { key: "accion", title: "Acción requerida", width: "36%", render: (h) => <span className="text-xs">{h.accion}</span> },
    { key: "fuente", title: "Fuente", width: "16%", render: (h) => citas(h.evidenceIds) },
  ];
  return <Tabla data={filas} columns={columns} rowKey={(h) => h.hito} />;
}

function Acciones({ filas, citas }: { filas: AccionBrecha[]; citas: Citador }) {
  if (filas.length === 0) return <Vacio texto="No hay brechas ni pendientes." />;
  const columns: TableColumn<AccionBrecha>[] = [
    { key: "numero", title: "#", width: "5%", render: (a) => <span className="text-sm">{a.numero}</span> },
    {
      key: "brecha",
      title: "Brecha / pendiente",
      width: "33%",
      render: (a) => (
        <div className="space-y-1 text-sm">
          <span>{a.brecha}</span>
          {a.tipo === "documental" && <p className="text-xs text-muted-foreground">Formato/soporte — no es brecha material</p>}
        </div>
      ),
    },
    { key: "empresa", title: "Empresa", width: "9%", render: (a) => <span className="text-sm">{a.empresa}</span> },
    { key: "accion", title: "Acción", width: "21%", render: (a) => <span className="text-xs">{a.accion}</span> },
    {
      key: "urgencia",
      title: "Urgencia",
      width: "14%",
      render: (a) => (
        <div className="space-y-1">
          <StatusBadge tone={URGENCIA[a.urgencia] ?? "muted"}>{a.urgencia}</StatusBadge>
          {a.fechaLimite && <p className="text-xs text-muted-foreground">{a.fechaLimite}</p>}
        </div>
      ),
    },
    {
      key: "fuente",
      title: "Responsable / fuente",
      width: "18%",
      render: (a) => (
        <div className="space-y-1 text-xs">
          <p>{a.responsable}</p>
          {a.subsanabilidad && <p className="text-muted-foreground">{SUBSANABILIDAD[a.subsanabilidad] ?? a.subsanabilidad}</p>}
          {citas(a.evidenceIds)}
        </div>
      ),
    },
  ];
  return <Tabla data={filas} columns={columns} rowKey={(a) => String(a.numero)} />;
}

function Tabla<T extends Record<string, unknown>>({ data, columns, rowKey }: { data: T[]; columns: TableColumn<T>[]; rowKey: (item: T) => string }) {
  return (
    <ItcTable
      data={data}
      columns={columns}
      rowKey={rowKey}
      pagination={false}
      tableLayout="fixed"
      responsiveStrategy="cards"
      striped
    />
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="text-sm text-muted-foreground">{texto}</p>;
}
