import { deflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";

function crc32(data: Buffer): number {
  let crc = ~0;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

export function zipFiles(files: { name: string; data: Buffer }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const compressed = deflateRawSync(file.data);
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    const localFull = Buffer.concat([local, compressed]);
    locals.push(localFull);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += localFull.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, end]);
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function run(text: string, opts?: { bold?: boolean; size?: number; color?: string; font?: string }): string {
  const size = opts?.size ?? 22;
  const color = opts?.color ?? "1B3A5F";
  const font = opts?.font ?? "Calibri";
  const bold = opts?.bold ? "<w:b/>" : "";
  return `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}

function paragraph(text: string, opts?: { bold?: boolean; size?: number; color?: string; align?: string; spaceAfter?: number }): string {
  const align = opts?.align ? `<w:jc w:val="${opts.align}"/>` : "";
  const after = opts?.spaceAfter ?? 120;
  return `<w:p><w:pPr>${align}<w:spacing w:after="${after}"/></w:pPr>${run(text, opts)}</w:p>`;
}

function emptyParagraph(): string {
  return `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>`;
}

function heading(text: string): string {
  return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="1B6CA8"/></w:pBdr><w:spacing w:before="280" w:after="120"/></w:pPr>${run(text.toUpperCase(), { bold: true, size: 24, color: "1B6CA8" })}</w:p>`;
}

function table(headers: string[], rows: string[][]): string {
  if (!rows.length) {
    return paragraph("Sin registros seleccionados.", { size: 20, color: "667085" });
  }
  const headerRow = `<w:tr>${headers
    .map(
      (h) =>
        `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1B3A5F"/><w:tcW w:w="2400" w:type="dxa"/></w:tcPr><w:p>${run(h, { bold: true, size: 18, color: "FFFFFF" })}</w:p></w:tc>`,
    )
    .join("")}</w:tr>`;
  const body = rows
    .map(
      (row) =>
        `<w:tr>${row
          .map(
            (cell) =>
              `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr><w:p>${run(cell || "—", { size: 18, color: "1B3A5F" })}</w:p></w:tc>`,
          )
          .join("")}</w:tr>`,
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D0D5DD"/><w:left w:val="single" w:sz="4" w:color="D0D5DD"/><w:bottom w:val="single" w:sz="4" w:color="D0D5DD"/><w:right w:val="single" w:sz="4" w:color="D0D5DD"/><w:insideH w:val="single" w:sz="4" w:color="D0D5DD"/><w:insideV w:val="single" w:sz="4" w:color="D0D5DD"/></w:tblBorders></w:tblPr>${headerRow}${body}</w:tbl>`;
}

export function hashBuffer(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export interface ResumeDocxInput {
  fullName: string;
  proposedRole: string;
  profession: string;
  city: string;
  summary: string;
  processLabel: string;
  generalMonths: number;
  education: { title: string; institution: string; graduatedOn: string | null; level?: string }[];
  experiences: {
    role: string;
    client: string;
    project: string;
    startedOn: string;
    endedOn: string | null;
    functions: string;
    activities?: string[];
  }[];
  certifications: { name: string; issuer: string; expiresOn: string | null; validity: string }[];
  licenses: { kind: string; issuer: string; number: string }[];
  extra?: string;
}

export function buildResumeDocx(input: ResumeDocxInput): Buffer {
  const years = (input.generalMonths / 12).toFixed(1);
  const body = [
    paragraph("TENDEROPS", { bold: true, size: 28, color: "1B6CA8", align: "center", spaceAfter: 40 }),
    paragraph("Hoja de vida para propuesta de contratación pública", {
      size: 20,
      color: "667085",
      align: "center",
      spaceAfter: 40,
    }),
    paragraph(input.processLabel || "Proceso no asociado", { size: 18, color: "667085", align: "center" }),
    emptyParagraph(),
    paragraph(input.fullName, { bold: true, size: 36, align: "center", spaceAfter: 40 }),
    paragraph(`Cargo propuesto: ${input.proposedRole}`, { size: 22, align: "center", spaceAfter: 40 }),
    paragraph(
      [input.profession, input.city].filter(Boolean).join(" · ") || " ",
      { size: 20, color: "667085", align: "center" },
    ),
    heading("Perfil profesional"),
    paragraph(
      input.summary ||
        `${input.fullName} se presenta al cargo de ${input.proposedRole}. Experiencia general seleccionada: ${input.generalMonths} meses (${years} años), sin duplicar periodos simultáneos.`,
    ),
    heading("Formación académica"),
    table(
      ["Título", "Institución", "Nivel", "Grado"],
      input.education.map((item) => [item.title, item.institution, item.level ?? "", item.graduatedOn ?? "sin fecha"]),
    ),
    heading("Experiencia seleccionada"),
    paragraph(
      `Meses netos de la selección (periodos superpuestos fusionados): ${input.generalMonths}.`,
      { size: 20, color: "667085" },
    ),
    ...input.experiences.flatMap((item) => [
      paragraph(`${item.role} · ${item.client}`, { bold: true, size: 22, spaceAfter: 40 }),
      paragraph(
        `${item.project} · ${item.startedOn} – ${item.endedOn ?? "actual"}`,
        { size: 20, color: "667085", spaceAfter: 40 },
      ),
      item.functions ? paragraph(item.functions, { size: 20 }) : "",
      item.activities?.length ? paragraph(`Actividades: ${item.activities.join("; ")}`, { size: 20 }) : "",
    ]),
    heading("Certificaciones"),
    table(
      ["Certificación", "Emisor", "Vigencia"],
      input.certifications.map((item) => [
        item.name,
        item.issuer,
        item.validity === "vencida" ? "VENCIDA" : (item.expiresOn ?? "sin fecha"),
      ]),
    ),
    heading("Acreditaciones"),
    table(
      ["Tipo", "Entidad", "Número"],
      input.licenses.map((item) => [item.kind, item.issuer, item.number]),
    ),
    input.extra ? heading("Información adicional") : "",
    input.extra ? paragraph(input.extra) : "",
    emptyParagraph(),
    paragraph(
      "Este documento conserva únicamente los estudios, experiencias, certificaciones y acreditaciones seleccionados al generarlo. No sustituye soportes originales.",
      { size: 16, color: "667085" },
    ),
    paragraph(`Generado por TenderOps · ${new Date().toISOString().slice(0, 10)}`, {
      size: 16,
      color: "98A2B3",
      align: "center",
    }),
  ].join("");

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  return zipFiles([
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes) },
    { name: "_rels/.rels", data: Buffer.from(rels) },
    { name: "word/document.xml", data: Buffer.from(document) },
  ]);
}

export function applyTemplateVariables(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key: string) => values[key] ?? "");
}
