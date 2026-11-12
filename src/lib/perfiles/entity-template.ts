import { inflateRawSync } from "node:zlib";
import { applyTemplateVariables, zipFiles } from "./docx";

interface ZipEntry {
  name: string;
  data: Buffer;
}

function readUInt32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function readUInt16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

export function unzip(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;
  while (offset + 30 <= buffer.length && readUInt32LE(buffer, offset) === 0x04034b50) {
    const method = readUInt16LE(buffer, offset + 8);
    const compressedSize = readUInt32LE(buffer, offset + 18);
    const uncompressedSize = readUInt32LE(buffer, offset + 22);
    const nameLen = readUInt16LE(buffer, offset + 26);
    const extraLen = readUInt16LE(buffer, offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLen).toString();
    const start = offset + 30 + nameLen + extraLen;
    const compressed = buffer.subarray(start, start + compressedSize);
    const data = method === 8 ? inflateRawSync(compressed) : Buffer.from(compressed);
    if (data.length !== uncompressedSize && uncompressedSize > 0) {
      // Some writers omit sizes in the local header; keep inflated bytes.
    }
    entries.push({ name, data });
    offset = start + compressedSize;
  }
  return entries.filter((entry) => !entry.name.endsWith("/"));
}

function expandRepeating(xml: string, block: string, rows: Record<string, string>[]): string {
  const open = `{{#${block}}}`;
  const close = `{{/${block}}}`;
  const start = xml.indexOf(open);
  const end = xml.indexOf(close);
  if (start < 0 || end < 0 || end < start) return xml;
  const inner = xml.slice(start + open.length, end);
  const rendered = rows.map((row) => applyTemplateVariables(inner, row)).join("");
  return xml.slice(0, start) + rendered + xml.slice(end + close.length);
}

export interface EntityTemplateData {
  variables: Record<string, string>;
  experiencias: Record<string, string>[];
  estudios: Record<string, string>[];
  certificaciones: Record<string, string>[];
  acreditaciones: Record<string, string>[];
}

export function applyEntityTemplate(templateBytes: Buffer, data: EntityTemplateData): Buffer {
  const entries = unzip(templateBytes);
  if (!entries.length) {
    throw new Error("La plantilla DOCX de entidad no se pudo leer.");
  }
  const next = entries.map((entry) => {
    if (!entry.name.endsWith(".xml")) return entry;
    let xml = entry.data.toString("utf8");
    xml = expandRepeating(xml, "experiencias", data.experiencias);
    xml = expandRepeating(xml, "estudios", data.estudios);
    xml = expandRepeating(xml, "certificaciones", data.certificaciones);
    xml = expandRepeating(xml, "acreditaciones", data.acreditaciones);
    xml = applyTemplateVariables(xml, data.variables);
    return { name: entry.name, data: Buffer.from(xml) };
  });
  return zipFiles(next);
}
