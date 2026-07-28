// Siembra departamentos y ciudades (municipios) de Colombia desde DIVIPOLA,
// la división político-administrativa oficial (DANE), publicada por MinSalud
// en datos.gov.co:
//   - Departamentos: dataset ya3g-4kqg (iddepto, nomdepto)
//   - Municipios:    dataset pqwj-3fi4 (iddepto, idmupio, nommpio)
//
// Uso: node scripts/seed-ubicaciones.mjs
//
// Idempotente: usa ON CONFLICT DO NOTHING sobre las llaves únicas de nombre,
// así que puede re-ejecutarse para completar datos sin duplicar ni pisar
// registros editados a mano.

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL es requerido (defínelo en .env.local).");
  process.exit(1);
}

const URL_DEPARTAMENTOS = "https://www.datos.gov.co/resource/ya3g-4kqg.json?$limit=100";
const URL_MUNICIPIOS = "https://www.datos.gov.co/resource/pqwj-3fi4.json?$limit=2000";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error(`${url} llegó vacío.`);
  return data;
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  console.log("Descargando DIVIPOLA desde datos.gov.co…");
  const [deptos, municipios] = await Promise.all([
    fetchJson(URL_DEPARTAMENTOS),
    fetchJson(URL_MUNICIPIOS),
  ]);

  const nombrePorCodigo = new Map();
  for (const d of deptos) {
    if (d.iddepto && d.nomdepto?.trim()) nombrePorCodigo.set(d.iddepto, d.nomdepto.trim());
  }
  if (nombrePorCodigo.size < 30) {
    throw new Error(
      `Solo se reconocieron ${nombrePorCodigo.size} departamentos; el formato del dataset pudo cambiar.`,
    );
  }

  const municipiosPorCodigo = new Map();
  for (const m of municipios) {
    const codigo = m.iddepto;
    const nombre = m.nommpio?.trim();
    if (!codigo || !nombre || !nombrePorCodigo.has(codigo)) continue;
    if (!municipiosPorCodigo.has(codigo)) municipiosPorCodigo.set(codigo, new Set());
    municipiosPorCodigo.get(codigo).add(nombre);
  }

  let ciudadesInsertadas = 0;
  for (const [codigo, nombreDepto] of nombrePorCodigo) {
    const [row] = await sql`
      insert into departamentos (nombre) values (${nombreDepto})
      on conflict (nombre) do nothing
      returning id`;
    const deptoId =
      row?.id ?? (await sql`select id from departamentos where nombre = ${nombreDepto}`)[0].id;

    const nombres = [...(municipiosPorCodigo.get(codigo) ?? [])];
    if (nombres.length === 0) continue;
    const values = nombres.map((nombre) => ({ nombre, departamento_id: deptoId }));
    const inserted = await sql`
      insert into ciudades ${sql(values, "nombre", "departamento_id")}
      on conflict (nombre, departamento_id) do nothing
      returning id`;
    ciudadesInsertadas += inserted.length;
  }

  const [{ deps, cius }] = await sql`
    select
      (select count(*)::int from departamentos) as deps,
      (select count(*)::int from ciudades) as cius`;
  console.log(
    `Listo: ${nombrePorCodigo.size} departamentos procesados, ${ciudadesInsertadas} ciudades nuevas.`,
  );
  console.log(`Totales en base: ${deps} departamentos, ${cius} ciudades.`);
} catch (e) {
  console.error("Error en el seed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
