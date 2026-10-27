# P1 — análisis detenido

Fecha: 2026-10-27. Repositorio inspeccionado: `innovacionITC/tenderops-itc` (`origin/main`).

## Bloqueo

`TENDEROPS_API_URL` apunta, en `.env.local.example`, a `http://localhost:5106`. En este workspace no hay solución .NET. `gh search repos tenderops --owner innovacionITC` solo devuelve este frontend.

Sin ese repositorio no se pueden crear migraciones, endpoints, OpenAPI real, permisos de servidor, auditoría ni SharePoint. Inventarlos aquí rompería la regla de que PostgreSQL y las integraciones solo los toca el API. Este P1 no está implementado.

SECOP y Dynamics no se modificaron.

## Lo que ya existe y no se toca

- BFF: `src/lib/api/client.ts` (`apiFetch`), cookies HttpOnly, `requireAuth()` vía `GET /auth/me`.
- Roles de menú en `src/lib/auth/roles.ts`: `superadmin`, `administrador`, `director`, `gestor`, `consultor`, `lectura`. No hay permisos finos (`profiles.read`, etc.).
- Expediente de seguimiento: `src/app/(app)/seguimiento/[id]/`. Ya tiene pestañas de tareas, matriz, análisis IA, asistente y CRM. Esas pestañas de CRM/Dynamics quedan fuera de este P1.
- Documentos de proceso que hoy pasan por el API hacia CRM. No hay cliente Graph en Next.js. Correcto: no debe haberlo.
- OpenAPI versionado: `src/lib/api/openapi.json`. No contiene perfiles, matching, hojas de vida, BID/NO BID ni SharePoint genérico.

## Orden propuesto cuando el API esté clonado

Cada paso es una migración en el API, un grupo de endpoints, regeneración de `schema.d.ts` y pantallas que solo llaman `apiFetch`. No se persiste nada en Next.js.

1. Permisos. Tabla de permisos por rol y organización. El API los exige en cada acción. `GET /auth/me` (o un recurso aparte ya existente) debe informar los permisos para ocultar botones. El menú no autoriza.
2. Perfiles. Entidades separadas: datos internos, documento de identidad, costos, consentimiento, educación, experiencia, certificaciones, idiomas, habilidades. Borrador no entra en una propuesta aprobada. Unicidad por organización + documento y por correo. Binarios no van a Postgres.
3. Importación Excel. Solo después del modelo de perfiles. Validar, previsualizar, confirmar. Idempotencia por hash de archivo + fila. Sin macros. El archivo no se loguea.
4. Matching determinista. Reglas versionadas. Periodos solapados no suman dos veces. El resultado explica cada requisito. Un ajuste humano no borra el cálculo.
5. Hojas de vida. Plantilla DOCX en el almacén documental, no en la base. Versión por proceso, persona y plantilla. Checksum. Aprobada queda inmutable.
6. Preparación del proceso. Ampliar el workspace actual con estados `Borrador → En análisis → En preparación → En revisión → Aprobado → Presentado → Cerrado → Cancelado`. Transiciones cerradas, con comentario y auditoría.
7. Matriz. Categorías, obligatorio/deseable, evidencia, bloqueo de cierre si un obligatorio no está resuelto. Enlazar requisito de personal con perfil.
8. BID/NO BID. Recomendación, decisión y aprobación son registros distintos. NO BID exige motivo. Aprobada no se pisa: nueva versión.
9. SharePoint. Metadatos en Postgres, bytes en Graph. Si no hay credencial, el API responde error de integración. El front no guarda el archivo en disco ni finge éxito.
10. Equipo propuesto. Congelar la versión del perfil al aprobar. Sin consentimiento o con documentos vencidos, no se asigna.
11. Tareas internas. Ajenas a Dynamics. Asociación opcional a proceso, requisito, documento, perfil o decisión.
12. Auditoría. Correlation id desde el BFF (`apiFetch` ya registra `traceId` en 5xx). Sin documentos, tokens ni costos en el log.

## Qué no se puede dar por hecho

- Nombres de tablas y rutas REST finales: los define el API al implementar, y el OpenAPI se genera desde ahí.
- SharePoint operativo: no hay tenant, sitio ni prueba de carga en este entorno.
- Pruebas de build de este incremento: no hay código de P1 que compilar.

## Para continuar

Hace falta la URL de Git del API que sirve `TENDEROPS_API_URL`, con permiso de lectura y de apertura de cambios. No es `Intelecto-TenderOps/TenderOps`.
