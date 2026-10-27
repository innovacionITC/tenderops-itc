# ADR 001 — El API .NET es la única autoridad de negocio y persistencia

- Estado: aceptada para el frontend de este repositorio. La implementación en el API .NET no se pudo verificar en este trabajo.
- Fecha: 2026-10-27
- Alcance: `innovacionITC/tenderops-itc`

## Contexto

TenderOps separa la interfaz de la autoridad de datos. El navegador habla con Next.js. Next.js, como BFF, habla con un API .NET cuya URL llega por `TENDEROPS_API_URL`. Ese API es quien debe autenticar, autorizar, validar, auditar, persistir e integrar sistemas externos. PostgreSQL vive en Supabase y no debe recibir conexiones desde Next.js.

El README histórico de este repositorio todavía describe Supabase Auth y Drizzle como camino activo. El código de runtime ya no importa `@/db` ni `@supabase/*`. Quedan restos: el cliente Drizzle, el esquema introspectado, `scripts/seed-ubicaciones.mjs`, dependencias `drizzle-orm`, `postgres`, `drizzle-kit`, `@supabase/supabase-js` y `@supabase/ssr`, y variables `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_*`.

## Decisión

1. El API .NET es el backend canónico. Next.js no consulta ni modifica PostgreSQL.
2. Supabase PostgreSQL es persistencia del API. El navegador no recibe la URL de servicio, la anon key para datos, ni la service role.
3. El contrato entre Next.js y el API es OpenAPI. Los tipos de `src/lib/api/schema.d.ts` se generan con `openapi-typescript` desde `src/lib/api/openapi.json`. No se agregan rutas al JSON solo para que el frontend compile.
4. La sesión canónica es la del API: `POST /auth/login`, `POST /auth/sso/entra`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` y `POST /auth/switch-organization`. Las cookies `access_token` y `refresh_token` son HttpOnly, `SameSite=Lax` y `Secure` en producción. El refresh es rotatorio y el BFF deduplica renovaciones concurrentes del mismo token.
5. La organización activa viaja en el token que emite el API al cambiar de organización. Ocultar un menú no autoriza una operación.
6. El código residual de Drizzle y de clientes Supabase se retira del runtime cuando se demuestre que no tiene consumidores. Hasta ese retiro, `src/db` no forma parte del camino de una request. No se borra el esquema en este diagnóstico porque `drizzle-kit` y el script de seed todavía lo referencian, y no hay acceso al API para confirmar que esas tablas ya no necesitan introspección local.

## Consecuencias

- Una función nueva entra por Server Component o Server Action, llama `requireAuth()` y después `apiFetch`. No abre una conexión a Postgres.
- Cualquier diferencia entre una llamada del frontend y el OpenAPI es un defecto de contrato, no un permiso para inventar la respuesta.
- Este ADR no afirma que el API cifre `credenciales_api`, aplique rate limiting ni publique el OpenAPI en CI. Eso queda bloqueado hasta clonar el repositorio del API. Ver `system-ownership.md`.

## Qué no se decidió aquí

No se incorpora el backend de `Intelecto-TenderOps/TenderOps`. No se cambia el modelo de tokens. No se despliega a producción.
