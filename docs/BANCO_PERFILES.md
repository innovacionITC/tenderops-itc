# Banco de Perfiles y generador de hojas de vida

Módulo de TenderOps (este repositorio Next.js) que persiste profesionales en Supabase PostgreSQL y genera DOCX reales a partir de una selección de estudios, experiencias y certificaciones.

El dominio (importación Excel de siete hojas, fusión de periodos superpuestos, matching contra un cargo y plantilla corporativa) se portó desde `Intelecto-TenderOps/TenderOps` (`frontend/src/features/perfiles` y `apps/api-azure/src/domains/professionals`). La UI, el menú Crystal, `requireAuth()` y el aislamiento por organización activa son los de este producto.

## Arquitectura

```text
Navegador
  → Server Components / Server Actions / Route Handlers (requireAuth)
  → ProfessionalService (autorización por rol y organization_id)
  → PostgreSQL public.professional_profiles   (DATABASE_URL)
  → Storage bucket professional-documents     (SUPABASE_SERVICE_ROLE_KEY)
```

El navegador no recibe `service_role` ni el número de documento. El BFF autentica con la API .NET (`/auth/me`) y solo entonces habla con Postgres/Storage.

Los demás módulos siguen yendo a la API .NET. Este módulo no migra el resto de TenderOps a Supabase.

## Activar en un proyecto Supabase

1. Abra **SQL Editor** en el proyecto de TenderOps.
2. Pegue y ejecute `supabase/migrations/20261112_professional_profiles.sql`.
3. Compruebe:

```sql
SELECT to_regclass('public.professional_profiles');
-- debe devolver public.professional_profiles

SELECT id, name, public FROM storage.buckets WHERE id = 'professional-documents';
```

4. Configure en el entorno del BFF (Vercel / `.env.local`), sin pegar secretos en el código:

| Variable | Uso |
| --- | --- |
| `TENDEROPS_API_URL` | Auth y el resto de módulos (ya existía) |
| `DATABASE_URL` | Conexión Postgres (pooler). El BFF filtra siempre por `organization_id` de la organización activa |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto, usada solo en el servidor para Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor. Sube/descarga DOCX y soportes del bucket privado |

No use `service_role` en el cliente. RLS de la tabla y del bucket niega `anon` y `authenticated`: el acceso pasa por el backend.

Hasta que la migración no se ejecute, la pantalla del banco muestra el error de tabla inexistente. No se afirma que la tabla exista en un proyecto concreto si no se ha verificado con `to_regclass`.

## Rutas

- `/perfiles` — banco, indicadores, importación, ficha, generador
- `/seguimiento/[id]` pestaña **Equipo y HV** — asociar un profesional real al proceso, comparar con el cargo y generar la HV
- `GET /api/perfiles/plantilla` — Excel de siete hojas
- `GET /api/perfiles/resumes/{profesional}/{hv}` — descarga DOCX
- `GET /api/perfiles/soportes/{profesional}/{id}` — descarga de soporte

## Permisos

| Acción | Roles |
| --- | --- |
| Consultar | cualquier usuario autenticado de la organización activa |
| Crear, editar, importar, generar, asociar | gestor, director, administrador, superadmin |
| Aprobar HV | director, administrador, superadmin |

Un usuario no puede leer perfiles de otra organización: todas las consultas llevan `organization_id = auth.activeOrganizationId`.

## Datos personales (Ley 1581)

- `document_number`, `email` y `phone` viven en columnas de Postgres.
- La API pública solo devuelve máscaras (`****1234`, `a***@dominio`).
- `identity_fingerprint` = SHA-256(`organization_id|TIPO|número`) para duplicados.
- Generar o presentar una HV exige consentimiento de **presentación**.

## Plantillas DOCX

- **Corporativa:** OOXML generado en `src/lib/perfiles/docx.ts` (encabezado, perfil, tablas de formación/experiencia/certificaciones/acreditaciones, pie).
- **Entidad:** DOCX subido por organización (`{org}/_templates/entidad.docx`). Variables `{{profesional.nombreCompleto}}`, `{{profesional.profesion}}`, `{{perfil.cargoPropuesto}}`, `{{proceso.identificador}}`. Bloques repetibles `{{#experiencias}}…{{/experiencias}}` (igual `estudios`, `certificaciones`, `acreditaciones`). No se aplastan en un solo párrafo.

Cada generación guarda metadatos y un **snapshot** en `generated_resumes` (JSONB) y el binario en Storage. Regenerar crea una versión nueva; una HV aprobada no se sobrescribe.

## Pruebas

```bash
npm test
```

Cubren fusión de meses superpuestos, aislamiento entre organizaciones, importación Excel, DOCX con solo las experiencias marcadas y versionado.

## Limitaciones

- La tabla no se crea sola: hay que ejecutar la migración en el SQL Editor.
- Sin `DATABASE_URL` / Storage el módulo no persiste; el resto de TenderOps sigue funcionando.
- La búsqueda usa `ILIKE` sobre columnas y JSONB, no un índice `tsvector`.
- Las variables de plantilla de entidad deben quedar en un solo run de Word; si Word parte `{{…}}` el reemplazo puede fallar.
- El API .NET aún no expone este recurso: cuando exista, este BFF debería delegar y retirar el acceso directo a Postgres.
