# Banco de Perfiles y generador de hojas de vida

Módulo de TenderOps que lista profesionales, importa Excel y genera HV DOCX. La **persistencia** vive en el API .NET (`TENDEROPS_API_URL`), que ya tiene la conexión a Supabase. Este frontend no usa `DATABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY`.

## Arquitectura

```text
Navegador
  → Server Components / Server Actions / Route Handlers (requireAuth)
  → apiFetch / apiFetchRaw  →  API .NET /perfiles
  → PostgreSQL public.professional_profiles
  → Storage bucket professional-documents
```

Igual que plantillas, SECOP y seguimiento. El navegador no recibe `service_role` ni el número de documento.

Excel (plantilla e importación) y el DOCX corporativo se arman en el BFF (exceljs / OOXML). El API guarda filas JSON y archivos.

Contrato HTTP: [`docs/architecture/perfiles-api-contract.md`](./architecture/perfiles-api-contract.md).

## Activar

1. Tabla y bucket (ya ejecutado si `to_regclass` devuelve la tabla):

```sql
SELECT to_regclass('public.professional_profiles');
SELECT id, name, public FROM storage.buckets WHERE id = 'professional-documents';
```

2. **No** agregue las keys de Supabase al proyecto Next.js. Déjelas en el API .NET.
3. Implemente `/perfiles` en tenderops-api (mismo aislamiento por organización activa que el resto de recursos). Hay un esqueleto en el contrato.
4. Despliegue este frontend. Solo hace falta `TENDEROPS_API_URL`.

Hasta que el API no exponga `/perfiles`, la pantalla muestra el error `perfiles_api_missing`.

## Permisos

| Acción | Roles |
| --- | --- |
| Consultar | cualquier usuario autenticado de la organización activa |
| Crear, editar, importar, generar, asociar | gestor, director, administrador, superadmin |
| Aprobar HV | director, administrador, superadmin |

El API debe volver a comprobar rol y `organization_id` del token. Ocultar el menú no autoriza.

## Datos personales (Ley 1581)

- `document_number`, `email` y `phone` viven en Postgres, detrás del API.
- El BFF enmascara antes de pintar (`****1234`, `a***@dominio`).
- `identity_fingerprint` = SHA-256(`organization_id|TIPO|número`).
- Generar o presentar una HV exige consentimiento de **presentación**.

## Pruebas

```bash
npm test
```

Cubren dominio (fusión de meses, importación, DOCX, versionado, aislamiento) con repositorio en memoria. No hablan con Postgres ni con el API.

## Limitaciones

- Este repositorio no contiene tenderops-api. Hay que agregar los endpoints allí.
- No se añadió `/perfiles` a `openapi.json` hasta que el API lo publique (ADR 001).
- La plantilla de entidad debe dejar `{{variables}}` en un solo run de Word.
