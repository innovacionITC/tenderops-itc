# Contrato API — Banco de Perfiles

El frontend llama estos paths con el mismo Bearer que el resto (`apiFetch`). El API usa **las keys de Supabase que ya tiene** (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, URL del proyecto). Filtra siempre por la organización activa del token. No confíe en `organizationId` del body.

JSON en camelCase, igual que `StoredProfessional` en `src/lib/perfiles/stored.ts`. Errores: ProblemDetails (`status`, `detail`, `code`).

Tabla: `public.professional_profiles`. Bucket: `professional-documents` (privado). SQL: `supabase/migrations/20261112_professional_profiles.sql`.

## Endpoints

| Método | Path | Notas |
| --- | --- | --- |
| GET | `/perfiles/indicadores` | `{ total, active, available, incomplete, expiringCertifications, proposed, pendingDocuments }` |
| GET | `/perfiles` | Query: `buscar`, `profession`, `profile`, `specialty`, `technology`, `certification`, `city`, `availability`, `status`, `verification`, `minYears`, `sort`, `page`, `pageSize`, `todos=1`, `tenderId`. Respuesta `{ items, total }`. `items` son filas almacenadas (PII incluido: solo BFF). |
| GET | `/perfiles/{id}` | 404 si no es de la org |
| PUT | `/perfiles/{id}` | Upsert de la fila completa. 409 si `identityFingerprint` choca. |
| GET | `/perfiles/clave` | Query `externalId` **o** `fingerprint`. 404 si no hay. |
| POST | `/perfiles/archivos` | FormData: `path`, `contentType`, `file`. Sube al bucket. |
| GET | `/perfiles/archivos?path=` | Binario |
| DELETE | `/perfiles/archivos?path=` | |
| GET | `/perfiles/{id}/hv/{resumeId}/archivo` | DOCX; 404 si el path no está en `generatedResumes` de esa fila |
| GET | `/perfiles/{id}/soportes/{attachmentId}` | 404 si no está en `attachments` |

Roles (espejo del frontend): lectura para cualquier autenticado de la org; escritura gestor+; aprobar HV es responsabilidad del BFF hoy, el API igual debe rechazar PUT de quien no pueda seguir procesos si esa es la política global.

## SQL de upsert (referencia)

El frontend envía el objeto camelCase. Mapear a columnas snake_case. `ON CONFLICT (id) DO UPDATE` como en el BFF anterior: no pise `document_number` / `email` / `phone` con null (`COALESCE`).

Aislar:

```sql
WHERE organization_id = @org
```

en **todas** las lecturas y en el UPDATE. Un PUT de otra org debe ser 404, no overwrite.

## Storage

`PUT {SUPABASE_URL}/storage/v1/object/professional-documents/{path}`  
Header `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`  
`x-upsert: true`

El path lo calcula el BFF (`{org}/{professionalId}/hv/...`). El API debe comprobar que el prefijo empiece por `{organizationId}/`.

## Qué no hace este frontend

No abre Postgres. No usa `service_role`. Excel y DOCX corporativo se generan aquí y se mandan al API como archivo + JSON de la ficha.
