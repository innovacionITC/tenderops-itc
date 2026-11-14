export type PageItem = number | "gap";

const numberFormat = new Intl.NumberFormat("es-CO");

export function formatCount(value: number): string {
  return numberFormat.format(value);
}

/** Ventana de páginas con elipsis. Hasta 7 páginas se listan todas. */
export function buildPageItems(page: number, count: number): PageItem[] {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount <= 0) return [];
  if (safeCount <= 7) {
    return Array.from({ length: safeCount }, (_, index) => index + 1);
  }

  const current = Math.min(Math.max(1, Math.floor(page)), safeCount);
  let start = Math.max(2, current - 1);
  let end = Math.min(safeCount - 1, current + 1);

  if (current <= 3) {
    start = 2;
    end = 4;
  } else if (current >= safeCount - 2) {
    start = safeCount - 3;
    end = safeCount - 1;
  }

  const items: PageItem[] = [1];
  if (start > 2) items.push("gap");
  for (let index = start; index <= end; index += 1) items.push(index);
  if (end < safeCount - 1) items.push("gap");
  items.push(safeCount);
  return items;
}

export function pageRange(page: number, pageSize: number, totalItems: number) {
  if (totalItems <= 0 || pageSize <= 0) {
    return { start: 0, end: 0 };
  }
  const start = (Math.max(1, page) - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);
  return { start, end: Math.max(start, end) };
}
