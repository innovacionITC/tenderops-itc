# TenderOps

Plataforma de gestión de procesos licitatorios (SECOP, seguimiento comercial, tareas, indicadores). Este repo es una **reescritura en Next.js** de la app anterior (`tenderops-itc`); varias secciones del menú siguen marcadas como `comingSoon` porque aún no se han migrado.

> Este documento describe la arquitectura y convenciones reales del proyecto — es la referencia a seguir al construir features nuevas. Para las particularidades de este fork de Next.js (rutas, convenciones que difieren del Next.js estándar), ver [AGENTS.md](./AGENTS.md).

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Supabase**: Auth (login con email/password y SSO Microsoft Entra ID vía provider `azure`) + Postgres
- **Drizzle ORM** (`postgres-js`) para todo el acceso a datos desde el servidor
- **Tailwind CSS 4** + shadcn/ui (`radix-ui`) para la UI
- **Zod** para validación de inputs en Server Actions

## Estructura del proyecto

```
src/
  app/
    (app)/                  # Rutas autenticadas, envueltas por layout.tsx que llama requireAuth()
      dashboard/page.tsx
      calendario/
        page.tsx
        actions.ts          # Server Actions de esta sección
        calendar-view.tsx
      layout.tsx            # Guard: requireAuth() + shell (sidebar, header, notificaciones)
    auth/callback/route.ts  # Callback OAuth (Supabase <-> Entra ID)
    login/                  # Ruta pública
    layout.tsx              # Root layout
  components/
    layout/                 # Shell de la app: sidebar, header, nav, page-header, stat-card
    ui/                     # Componentes shadcn/ui (generados, no editar a mano el core)
  lib/
    auth/
      session.ts            # getAuthContext() / requireAuth() — punto único de autorización
      roles.ts               # AppRole, hasAnyRole, canFollow/canApprove/canAdmin
    supabase/
      client.ts              # Cliente para Client Components
      server.ts               # Cliente para Server Components/Actions/Route Handlers (cookies)
      proxy.ts                # updateSession() usado por src/proxy.ts
      admin.ts                # Cliente service-role (bypassa RLS) — uso restringido, ver abajo
    dashboard.ts, calendar.ts, tasks.ts,
    notifications.ts, audit.ts, credentials.ts, powerbi.ts
                              # Data Access Layer: una función por caso de uso, consumida
                              # directamente desde Server Components/Actions
    format.ts, utils.ts
  db/
    index.ts                 # Instancia de Drizzle (conexión directa a Postgres)
    schema/
      schema.ts               # Generado por `npm run db:pull` — NO editar a mano (ver más abajo)
      relations.ts             # Generado por `npm run db:pull`
      auth-users.ts             # Stub manual de auth.users (Supabase), fuera del schema "public"
  proxy.ts                   # Equivalente a middleware.ts en este fork de Next.js
  env.ts / env.server.ts     # Validación de env vars (públicas / solo-servidor) con Zod
```

## Autenticación

- Login con email/password **o** SSO con Microsoft Entra ID, ambos vía Supabase Auth (provider `azure` configurado en el dashboard de Supabase, no en este repo).
- `src/proxy.ts` es el equivalente a `middleware.ts` en este fork de Next.js. Corre en cada request, refresca la sesión de Supabase y redirige a `/login` si no hay usuario — **excepto** en `PUBLIC_ROUTES` (`/login`, `/auth`). Cualquier ruta nueva que deba ser pública (páginas de error, webhooks, etc.) debe agregarse ahí explícitamente.
- El callback OAuth vive en `src/app/auth/callback/route.ts` — por eso `/auth` está excluido del guard, si no, el proxy interceptaría el `code` antes de que se intercambie por la sesión.

## Roles y autorización (guards)

Roles definidos en Postgres como enum `app_role`: `administrador`, `director`, `gestor`, `consultor`, `lectura`. Se resuelven desde la tabla `user_roles` (un rol por usuario).

**Importante:** la conexión de Drizzle a Postgres es directa (no impersonada), por lo que **las políticas RLS de Supabase (`pgPolicy(...)` en `schema.ts`) no se aplican realmente** a las queries de la app. La autorización real ocurre en la capa de aplicación:

- `requireAuth(allowedRoles?)` en `src/lib/auth/session.ts` es el punto de entrada obligatorio en toda Server Component, Server Action o Route Handler que toque datos protegidos. Redirige a `/login` si no hay sesión; lanza error si el rol no está en `allowedRoles`.
- Helpers de rol en `src/lib/auth/roles.ts`: `hasAnyRole`, `canFollow` (admin/director/gestor), `canApprove` (admin/director), `canAdmin` (solo admin).
- En el menú (`src/components/layout/nav-config.ts`), los items usan `adminOnly` / `privilegedOnly` + `isMenuItemVisible(item, role)` para ocultar secciones — esto es solo UX, **no reemplaza** el `requireAuth()` del lado servidor.
- `src/lib/supabase/admin.ts` expone un cliente service-role que sí bypassa RLS — reservado para operaciones que no pueden hacerse con Drizzle (APIs de administración de Supabase Auth, ej. invitar/eliminar usuarios). Nunca importarlo en código de cliente.

**Regla al agregar una función/página nueva que lea o escriba datos protegidos: siempre empezar por `const { userId, role } = await requireAuth(allowedRolesSiAplica)`.**

## Base de datos (Drizzle)

El flujo es **pull-only**, no hay `db:generate`/`db:migrate`/`db:push`:

1. Los cambios de schema (crear/alterar/borrar tablas) se hacen directamente en Postgres/Supabase (SQL editor, dashboard, o script puntual).
2. Se corre `npm run db:pull` para reintrospectar la BD y regenerar `src/db/schema/schema.ts` y `relations.ts`.
3. **`db:pull` sobreescribe `schema.ts` por completo**, incluyendo el import manual de `usersInAuth`. Después de cada pull hay que volver a agregar, arriba del archivo:
   ```ts
   import { usersInAuth as users } from "./auth-users";
   export { usersInAuth } from "./auth-users";
   ```
   (pull solo introspecta el schema `public`; `auth.users` es de Supabase y se referencia a mano vía `src/db/schema/auth-users.ts`).
4. `npm run db:studio` abre Drizzle Studio contra la BD configurada en `DATABASE_URL`.

Solo existen en la BD las tablas que el código realmente usa (se depuraron las que quedaron de un modelo de datos más amplio sin usar todavía — ver sección Roadmap). Antes de crear una tabla nueva, confirmar que no exista ya algo similar.

## Patrón para features nuevas

**Lectura (Server Component):**
```ts
// src/lib/mi-feature.ts
import "server-only";
import { db } from "@/db";
// ...query con drizzle...
export async function getMiFeature() { /* ... */ }
```
```tsx
// src/app/(app)/mi-feature/page.tsx
export default async function Page() {
  await requireAuth(); // o requireAuth(["administrador", "director"]) si aplica
  const data = await getMiFeature();
  return /* ... */;
}
```

**Escritura (Server Action)** — ver `src/app/(app)/calendario/actions.ts` como referencia:
```ts
"use server";
export async function miAccion(input: unknown) {
  const { userId, role } = await requireAuth();
  const parsed = miSchema.parse(input);       // zod
  // reglas de negocio / chequeos de permiso adicionales con hasAnyRole
  // mutación vía Drizzle
  await recordAudit(userId, { action: "...", module: "...", entityType: "...", entityId: "..." });
  revalidatePath("/mi-feature");
  return { ok: true };
}
```

Convenciones:
- Toda query a Postgres pasa por Drizzle (`@/db`), nunca por `supabase.from(...)` con nombres de tabla en string.
- Server Components hacen fetch de datos directamente (no hay capa de API REST/tRPC interna); nada de `fetch("/api/...")` desde el propio front para datos propios.
- Mutaciones relevantes registran auditoría con `recordAudit` (`src/lib/audit.ts`).
- Componentes de UI reutilizables van en `components/ui` (shadcn — regenerar con su CLI, no tocar a mano el core) y `components/layout` (shell propio de la app).

## Variables de entorno

Ver `.env.local.example`. Resumen:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: públicas, cliente Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: solo servidor, para `lib/supabase/admin.ts`.
- `DATABASE_URL`: connection string directo de Postgres para Drizzle (no respeta RLS).
- Bloque comentado (`MICROSOFT_*`, `DATAVERSE_*`, `GRAPH_*`, `SECOP_*`, `COPILOT_*`): integraciones de fases futuras, todavía no usadas por el código.

## Roadmap / pendiente de migrar

Marcado como `comingSoon` en `nav-config.ts`: Consulta SECOP, Procesos en seguimiento, Plantillas, Indicadores, Auditoría (vista), Administración. Antes de reintroducir una tabla o integración para alguna de estas, confirmar que efectivamente se va a construir en el corto plazo — este proyecto prefiere mantener en la BD solo lo que el código usa activamente mientras se desarrolla.

## Getting Started

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El login redirige a `/dashboard` tras autenticar.

Otros scripts: `npm run lint`, `npm run format`, `npm run db:pull`, `npm run db:studio`.
