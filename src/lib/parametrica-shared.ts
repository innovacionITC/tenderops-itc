// Constantes de Paramétrica compartidas entre servidor y cliente.
// (lib/parametrica.ts es server-only y no puede importarse desde componentes
// cliente; lo que necesiten ambos lados vive aquí.)

/** Máximo de resultados que devuelve la búsqueda remota de ciudades. */
export const CIUDAD_SEARCH_LIMIT = 50;
