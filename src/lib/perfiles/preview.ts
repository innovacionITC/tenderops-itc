import type { ProfessionalRecord, ResumeSelection } from "./contracts";
import { mergeRanges, bogotaToday } from "./overlap";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function selectedExperienceMonths(record: ProfessionalRecord, experienceIds: string[]): number {
  return mergeRanges(
    record.experiences
      .filter((item) => experienceIds.includes(item.id))
      .map((item) => ({ start: item.startedOn, end: item.endedOn })),
    bogotaToday(),
  ).months;
}

export function buildResumePreview(
  record: ProfessionalRecord,
  selection: ResumeSelection,
  proposedRoleName: string,
  processLabel: string,
): { months: number; html: string } {
  const education = record.education.filter((item) => selection.educationIds.includes(item.id));
  const experiences = record.experiences.filter((item) => selection.experienceIds.includes(item.id));
  const certifications = record.certifications.filter((item) => selection.certificationIds.includes(item.id));
  const licenses = record.licenses.filter((item) => selection.licenseIds.includes(item.id));
  const months = selectedExperienceMonths(record, selection.experienceIds);
  const html = [
    `<p class="text-xs uppercase tracking-wide text-sky-700">TenderOps · ${escapeHtml(processLabel || "Sin proceso")}</p>`,
    `<h1 class="text-2xl font-semibold text-slate-800">${escapeHtml(selection.includeName ? record.professional.fullName : "Profesional")}</h1>`,
    `<p class="text-sm text-slate-600">${escapeHtml(proposedRoleName || "Cargo por definir")}</p>`,
    selection.includeProfession
      ? `<p class="text-sm">${escapeHtml(record.professional.profession)}${selection.includeCity ? ` · ${escapeHtml(record.professional.city)}` : ""}</p>`
      : "",
    selection.includeSummary && selection.summary ? `<p class="text-sm mt-2">${escapeHtml(selection.summary)}</p>` : "",
    `<p class="text-sm mt-3">Experiencia neta seleccionada: <strong>${months} meses</strong> (periodos superpuestos fusionados, no sumados).</p>`,
    `<h2 class="mt-4 text-sm font-semibold uppercase tracking-wide text-sky-800">Formación</h2>`,
    education.length
      ? `<ul class="list-disc pl-5 text-sm">${education.map((item) => `<li>${escapeHtml(item.title)} · ${escapeHtml(item.institution)}</li>`).join("")}</ul>`
      : `<p class="text-sm text-muted-foreground">Ningún estudio seleccionado.</p>`,
    `<h2 class="mt-4 text-sm font-semibold uppercase tracking-wide text-sky-800">Experiencia</h2>`,
    experiences.length
      ? `<ul class="list-disc pl-5 text-sm">${experiences.map((item) => `<li>${escapeHtml(item.role)} · ${escapeHtml(item.client)} · ${escapeHtml(item.project)} (${escapeHtml(item.startedOn)} – ${escapeHtml(item.endedOn ?? "actual")})</li>`).join("")}</ul>`
      : `<p class="text-sm text-muted-foreground">Ninguna experiencia seleccionada.</p>`,
    `<h2 class="mt-4 text-sm font-semibold uppercase tracking-wide text-sky-800">Certificaciones</h2>`,
    certifications.length
      ? `<ul class="list-disc pl-5 text-sm">${certifications.map((item) => `<li>${escapeHtml(item.name)} · ${escapeHtml(item.issuer)}${item.validity === "vencida" ? " · VENCIDA" : ""}</li>`).join("")}</ul>`
      : `<p class="text-sm text-muted-foreground">Ninguna certificación seleccionada.</p>`,
    `<h2 class="mt-4 text-sm font-semibold uppercase tracking-wide text-sky-800">Acreditaciones</h2>`,
    licenses.length
      ? `<ul class="list-disc pl-5 text-sm">${licenses.map((item) => `<li>${escapeHtml(item.kind)} · ${escapeHtml(item.issuer)} · ${escapeHtml(item.number)}</li>`).join("")}</ul>`
      : `<p class="text-sm text-muted-foreground">Ninguna acreditación seleccionada.</p>`,
  ].join("");
  return { months, html };
}
