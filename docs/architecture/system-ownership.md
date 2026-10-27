# Ownership del sistema TenderOps

Fecha del inventario: 2026-10-27. Fuente: código de `innovacionITC/tenderops-itc` en `main` (`9aff217`) más el OpenAPI versionado en `src/lib/api/openapi.json` (84 paths). El repositorio del API .NET no está en este workspace ni aparece como repositorio visible de la organización `innovacionITC` (`gh search repos tenderops --owner innovacionITC` devolvió solo este frontend).

## Bloqueo

`TENDEROPS_API_URL` apunta, en `.env.local.example`, a `http://localhost:5106`. No hay clon del API, ni solución `.csproj`, ni permiso para leer otro repositorio. Sin ese código no se puede:

- confirmar que los endpoints que el frontend llama y que no están en el OpenAPI versionado existen;
- generar el OpenAPI desde el API;
- probar cifrado de credenciales, revocación de refresh, autorización por rol en el servidor ni aislamiento multiempresa;
- añadir CI del backend.

No se reconstruyó ni se simuló el API. El P0 no está terminado.

## Contexto

```text
Navegador
  → Next.js (UI, Server Components, Server Actions, Route Handlers, cookies HttpOnly)
  → API .NET (TENDEROPS_API_URL)   [repositorio no disponible]
  → Supabase PostgreSQL e integraciones externas
```

```text
Request de página autenticada
  src/proxy.ts
    si no hay access_token pero sí refresh_token → POST {API}/auth/refresh
    sin sesión y ruta no pública → redirect /login
  src/app/(app)/layout.tsx
    requireAuth() → GET {API}/auth/me
  Server Component o Server Action
    apiFetch() con Authorization: Bearer
    si 401 → un solo POST /auth/refresh por token (dedupedRefresh)
```

| Capa | Responsabilidad | No hace |
| --- | --- | --- |
| Navegador | Render, navegación, formularios | No llama a Supabase. No ve los tokens. |
| Next.js / BFF | UI, `requireAuth`, cookies, adaptación de respuestas, `apiFetch` | No es autoridad de negocio ni abre Postgres |
| API .NET | Auth, autorización, validación, auditoría, persistencia, jobs, integraciones | No verificado en este trabajo |
| Supabase PostgreSQL | Datos del sistema | Solo el API debería conectarse. Next.js aún puede hacerlo si alguien define `DATABASE_URL` y ejecuta Drizzle o el seed |
| Integraciones | SECOP, Dynamics, Graph/SharePoint, Power BI, Entra, Copilot | El frontend solo dispara operaciones del API o abre una URL que el API devuelve |

## Rutas Next.js

Páginas: `/`, `/login`, `/unauthorized`, `/dashboard`, `/secop`, `/seguimiento`, `/seguimiento/[id]`, `/plantillas`, `/indicadores`, `/calendario`, `/auditoria`, `/admin` y subrutas `organizaciones`, `usuarios`, `plantillas`, `parametricas`, `parametrica`, `credenciales`, `ciudades`, `departamentos`, `entidades`, `modalidades`, `unspsc`, `menu-demo`.

Route Handlers:

- `src/app/auth/callback/route.ts` — canje del code de Entra contra `POST /auth/sso/entra`.
- `src/app/api/plantillas/[id]/archivo/route.ts` — proxy de descarga hacia el API.

Server Actions (todas pasan por `apiFetch` salvo que se indique):

- `src/app/login/actions.ts` — login, logout, inicio Entra.
- `src/app/(app)/secop/actions.ts`
- `src/app/(app)/seguimiento/actions.ts`
- `src/app/(app)/seguimiento/[id]/actions.ts`
- `src/app/(app)/seguimiento/[id]/analisis-ia-actions.ts`
- `src/app/(app)/seguimiento/[id]/asistente-ia-actions.ts`
- `src/app/(app)/seguimiento/[id]/crm-actions.ts`
- `src/app/(app)/indicadores/actions.ts`
- `src/app/(app)/admin/*/actions.ts` — ciudades, departamentos, entidades, estados SECOP, modalidades, organizaciones, paramétrica, suborganizaciones, UNSPSC, usuarios, credenciales.
- `src/lib/plantillas-actions.ts`

`nav-config.ts` no marca ningún ítem como `comingSoon`. El campo sigue definido.

## Endpoints .NET en el OpenAPI versionado

84 paths, entre ellos `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/refresh`, `/auth/sso/entra`, `/auth/switch-organization`, `/dashboard`, `/secop/*`, `/procesos-seguimiento/*` (sin citas CRM ni filtros), `/crm` no existe como prefijo suelto, `/credenciales`, `/auditoria`, `/calendario`, `/notificaciones`, `/indicadores`, catálogos admin, `/plantillas`, `/powerbi/embed-url`, `/tareas`.

Llamadas del frontend que no están en ese contrato. No se añadieron al JSON:

| Llamada | Archivo | Estado |
| --- | --- | --- |
| `PATCH /secop/procesos/{id}/semaforo/reintentar` | `src/app/(app)/secop/actions.ts` | No verificable sin el API |
| `GET /crm/equipo-comercial` | `crm-actions.ts` | No verificable |
| `GET /crm/prioridades-cita` | `crm-actions.ts` | No verificable |
| `GET` y `POST /procesos-seguimiento/{id}/crm/citas` | `crm-actions.ts` | No verificable |
| `GET /procesos-seguimiento/filtros` | `src/lib/seguimiento.ts` | No verificable |
| `POST /procesos-seguimiento/{id}/reactivar` | `src/app/(app)/seguimiento/actions.ts` | No verificable |

Esas funciones siguen en la UI. Retirarlas sin el API borraría comportamiento que puede estar vivo en un backend más nuevo que el OpenAPI versionado.

## Tablas vistas en el esquema Drizzle

El archivo `src/db/schema/schema.ts` es una introspección antigua, no una conexión en runtime. Tablas `public`: `perfiles`, `roles_usuario`, `eventos_calendario`, `registros_auditoria`, `procesos_secop`, `notificaciones`, `evaluaciones_ia`, `procesos`, `credenciales_api`, `seguimientos_proceso`, `tareas`, `procesos_detectados`, `departamentos`, `ciudades`, `departamento_parametros`, `ciudad_parametros`, `parametrica_parametros`, `palabras_clave`, `modalidad_parametros`, `modalidades`, `entidades_parametros`, `entidades`, `unspsc_parametros`, `codigos_unspsc`, `estado_secop_parametros`, `estados_secop`, `nits`, `nit_parametros`.

Hay políticas `pgPolicy` generadas en ese archivo. No se aplican a las requests de Next.js porque la app no abre esa conexión. No hay vistas en el archivo. Funciones, jobs y el estado real de RLS en Supabase no son verificables desde aquí.

`src/db/index.ts` sigue creando un cliente `postgres` si alguien importa `@/db` y existe `DATABASE_URL`. Ningún otro archivo TypeScript importa `@/db`.

## Integraciones

| Sistema | Dónde se ve en el frontend | Autoridad esperada |
| --- | --- | --- |
| SECOP | `/secop/*` vía `apiFetch` | API |
| Dynamics / CRM | acciones CRM de seguimiento | API |
| SharePoint / Graph | documentos CRM y variables comentadas en `.env.local.example` | API |
| Power BI | `GET /powerbi/embed-url`; el dashboard solo muestra el iframe si hay URL | API guarda la URL |
| Entra | cookies PKCE y `POST /auth/sso/entra` | BFF inicia el code flow; el API emite los tokens |
| Copilot / IA | análisis IA, asistente IA y `NEXT_PUBLIC_DIRECTLINE_BASE_URL` leído en `seguimiento/[id]/data.ts` | API crea la sesión; el cliente puede hablar con Direct Line si el API devuelve un token |

## Matriz de capacidades

| Capacidad | Frontend | Endpoint versionado | Persistencia / integración | Estado |
| --- | --- | --- | --- | --- |
| Login y logout | `login/actions.ts` | `/auth/login`, `/auth/logout` | API | Activo en contrato |
| SSO Entra | `auth/callback/route.ts` | `/auth/sso/entra` | Entra + API | Activo en contrato. El API no se inspeccionó |
| Refresh | `cookies.ts`, `client.ts`, `proxy.ts` | `/auth/refresh` | API | Dedup en el proceso Node. Revocación de familia: solo documentada en comentarios |
| Organización activa | `switch-organization.ts` | `/auth/switch-organization` | API | Activo en contrato |
| Dashboard | `lib/dashboard.ts` | `/dashboard` | API | Activo |
| SECOP | `lib/secop.ts`, `secop/actions.ts` | `/secop/...` | API → SECOP | Reintento de semáforo fuera del contrato |
| Seguimiento | `lib/seguimiento.ts`, actions | `/procesos-seguimiento/...` | API | Filtros y reactivar fuera del contrato |
| CRM | `crm-actions.ts` | oportunidad y documentos sí; citas y catálogos no | API → Dynamics | Parcialmente fuera del contrato |
| IA | actions de análisis y asistente | paths de análisis y asistente | API → Copilot | Activo en contrato |
| Calendario, auditoría, notificaciones, indicadores, plantillas, admin, credenciales | libs y actions homónimas | paths homónimos | API → Postgres | Activo en contrato. Cifrado de `credenciales_api` no verificable |
| Power BI | `lib/powerbi.ts` | `/powerbi/embed-url` | API | Activo |

## Código activo, legado y no verificable

Activo: `src/lib/api/client.ts`, cookies de sesión, `requireAuth`, módulos `src/lib/*.ts` que llaman `apiFetch`, páginas bajo `src/app`.

Legado con consumidores solo de herramienta, no de una request:

- `src/db/**` — ningún import de aplicación. Lo usan el propio `index.ts` y, por configuración, `drizzle.config.ts`.
- `scripts/seed-ubicaciones.mjs` — lee `DATABASE_URL` y usa `postgres`.
- `src/env.ts` — exige `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ningún archivo importa `@/env`.
- Dependencias `@supabase/supabase-js` y `@supabase/ssr` — ningún import en `src/`.
- `DATABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `src/env.server.ts` — opcionales. El service role no se usa en código.

No verificable: implementación .NET, cifrado de secretos, jobs, funciones SQL, políticas vigentes en la base, y si el OpenAPI versionado está atrasado respecto del API desplegado.

## Credenciales

`CredencialResponse` en el OpenAPI expone `id`, `key`, `hasValue`, `description`, `updatedAt`. No expone el valor. El frontend no imprime secretos de `.env`. No hay evidencia en este repositorio de cifrado, Key Vault, auditoría de rotación ni separación de permisos dentro del API. Ese punto queda como bloqueo de seguridad: no se asume que `credenciales_api.valor` esté protegido.

## Autenticación observada en el BFF

Cookies en `src/lib/api/cookies.ts`: `httpOnly: true`, `sameSite: "lax"`, `secure` si `NODE_ENV === "production"`. El access token usa el `expiresIn` que devuelve el API; el refresh se guarda 30 días. Renovaciones concurrentes del mismo refresh token comparten una promesa. Logout llama `POST /auth/logout` con el refresh token. El proxy no autoriza por rol. CSRF, rate limit, límites de archivo y Problem Details del API no se pueden certificar sin el backend y pruebas.

## Qué falta para cerrar el P0

1. Acceso de lectura al repositorio del API .NET que sirve `TENDEROPS_API_URL` (nombre y URL de Git aún desconocidos).
2. Confirmar o implementar en ese API las seis llamadas fuera de contrato, con pruebas.
3. Regenerar OpenAPI desde el API y fallar CI si el archivo versionado difiere.
4. Retirar Drizzle, el seed directo, las dependencias Supabase y las variables residuales en un cambio aparte, después de confirmar que nadie ejecuta `db:pull` ni el seed como operación vigente.
5. Pruebas de auth, organización, contrato y CI en ambos lados.
6. Reescribir el README, que todavía dice que Next.js usa Supabase Auth y Drizzle como camino de datos.
