# TenderOps

Plataforma de gestión de procesos licitatorios (SECOP, seguimiento comercial, tareas, indicadores). Este repositorio es el **frontend Next.js** de TenderOps: una interfaz y un BFF. No es el backend ni la base de datos.

> La arquitectura canónica está en [`docs/architecture/adr-001-api-dotnet-source-of-truth.md`](./docs/architecture/adr-001-api-dotnet-source-of-truth.md) y el mapa de ownership en [`docs/architecture/system-ownership.md`](./docs/architecture/system-ownership.md). Para las particularidades de este fork de Next.js, ver [AGENTS.md](./AGENTS.md).

## Arquitectura

```text
Navegador
  → Next.js / BFF (este repo)
  → API .NET (TENDEROPS_API_URL)
  → Supabase PostgreSQL e integraciones externas
```

- El navegador no habla con Supabase ni recibe tokens.
- Next.js pinta la UI, guarda cookies HttpOnly, llama a `requireAuth()` y habla con el API mediante `apiFetch`.
- El API .NET autentica, autoriza, valida, audita, persiste e integra SECOP, Dynamics, Graph, Power BI, Entra y Copilot.
- PostgreSQL vive detrás del API. Este frontend no debe consultar ni modificar la base.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **BFF** hacia el API .NET: `src/lib/api/client.ts` (`apiFetch`)
- Contrato: `src/lib/api/openapi.json` → tipos con `npm run api:types`
- **Tailwind CSS 4** + shadcn/ui (`radix-ui`) + `itc-frontend-base`
- **Zod** en Server Actions

## Estructura

```
src/
  app/
    (app)/                  # Rutas autenticadas (layout llama requireAuth())
    auth/callback/route.ts  # Callback Entra: intercambia el code con el API
    login/
    api/plantillas/...      # Proxy de descarga de archivos hacia el API
  components/layout/        # Shell, barra Crystal, encabezados, filtros
  components/ui/            # shadcn/ui
  lib/
    api/                    # Cliente BFF, cookies, OpenAPI
    auth/session.ts         # getAuthContext() / requireAuth() vía GET /auth/me
    auth/roles.ts           # AppRole y helpers de visibilidad
    *.ts                    # Adaptadores de presentación: llaman apiFetch
  proxy.ts                  # Guard de sesión y refresh del access token
  env.server.ts             # Variables solo servidor
  db/                       # Esquema Drizzle residual. No forma parte del runtime
```

## Autenticación

La sesión la emite el API .NET, no Supabase Auth.

- Login: `POST /auth/login`. SSO Entra: el BFF inicia PKCE y `POST /auth/sso/entra`.
- Cookies `access_token` y `refresh_token`: HttpOnly, `SameSite=Lax`, `Secure` en producción.
- El access token dura lo que indique `expiresIn`. El refresh se rota; `apiFetch` y el proxy deduplican renovaciones concurrentes del mismo token.
- `src/proxy.ts` refresca si no hay access token y hay refresh. Sin sesión redirige a `/login`, salvo `/login` y `/auth`.
- Cerrar sesión llama `POST /auth/logout` y borra las cookies.
- Organización activa: `POST /auth/switch-organization`. El API reemite los tokens.

## Roles y autorización

Roles: `superadmin`, `administrador`, `director`, `gestor`, `consultor`, `lectura`.

- Toda Server Component, Server Action o Route Handler protegido empieza por `requireAuth(allowedRoles?)`.
- El menú oculta entradas con `adminOnly` / `privilegedOnly` / `consultOnly`. Eso es solo UX: el API autoriza de verdad.
- Helpers: `hasAnyRole`, `canFollow`, `canApprove`, `canAdmin`, `canConsult`.

## Cómo agregar una función

**Lectura (Server Component):**

```ts
import "server-only";
import { apiFetch } from "@/lib/api/client";

export async function getMiFeature() {
  return apiFetch<MiTipo>("/mi-recurso");
}
```

```tsx
export default async function Page() {
  await requireAuth();
  const data = await getMiFeature();
  return /* ... */;
}
```

**Escritura (Server Action):**

```ts
"use server";
export async function miAccion(input: unknown) {
  await requireAuth();
  const parsed = miSchema.parse(input);
  await apiFetch("/mi-recurso", { method: "POST", body: parsed });
  revalidatePath("/mi-feature");
}
```

No importar `@/db`, `drizzle-orm`, `postgres` ni clientes de Supabase. Si el endpoint no está en OpenAPI, el cambio va primero en el API .NET y después se regenera el contrato.

## Contrato OpenAPI

```bash
npm run api:types
```

Lee `src/lib/api/openapi.json` y escribe `src/lib/api/schema.d.ts`. El JSON debe salir del API; no se agregan rutas a mano para silenciar errores.

## Variables de entorno

Ver `.env.local.example`. Las que usa el runtime:

| Variable | Dónde | Uso |
| --- | --- | --- |
| `TENDEROPS_API_URL` | servidor | Base URL del API .NET |
| `MICROSOFT_TENANT_ID` | servidor, opcional | SSO Entra (PKCE en el BFF) |
| `MICROSOFT_CLIENT_ID` | servidor, opcional | SSO Entra |
| `MICROSOFT_CLIENT_SECRET` | servidor, opcional | SSO Entra |
| `NEXT_PUBLIC_DIRECTLINE_BASE_URL` | opcional | Cliente Direct Line del asistente IA |

`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_*` aparecen en el ejemplo por restos de una fase anterior. **La aplicación no las usa en runtime.** `src/db` y `npm run db:pull` / `db:studio` quedan solo como introspección local, no como camino de datos.

Las credenciales de Dynamics, Graph, SECOP y Copilot se administran en el API (pantalla Administración → Credenciales). El frontend solo ve si hay valor configurado, no el secreto.

## Módulos

Dashboard, Consulta SECOP, Procesos en seguimiento, Plantillas, Indicadores, Calendario, Auditoría y Administración están en el menú y hablan con el API. Ninguno está marcado como `comingSoon`.

## Desarrollo local

Hace falta el API .NET en la URL de `TENDEROPS_API_URL` (por defecto `http://localhost:5106`).

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El login redirige a `/dashboard`.

Otros scripts: `npm run lint`, `npm run format`, `npm run api:types`.
