// Alias corto sobre los tipos generados desde el openapi.json de la API
// (npm run api:types). No editar schema.d.ts a mano: regenerarlo.
import type { components } from "./schema";

export type ApiSchemas = components["schemas"];
