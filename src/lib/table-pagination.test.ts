import { describe, expect, it } from "vitest";
import { buildPageItems, pageRange } from "./table-pagination";

describe("buildPageItems", () => {
  it("lista todas las páginas cuando caben en la barra", () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
    expect(buildPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("acerca el inicio y el final sin cortar la página actual", () => {
    expect(buildPageItems(1, 20)).toEqual([1, 2, 3, 4, "gap", 20]);
    expect(buildPageItems(3, 20)).toEqual([1, 2, 3, 4, "gap", 20]);
    expect(buildPageItems(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
    expect(buildPageItems(18, 20)).toEqual([1, "gap", 17, 18, 19, 20]);
    expect(buildPageItems(20, 20)).toEqual([1, "gap", 17, 18, 19, 20]);
  });

  it("no genera páginas cuando no hay resultados", () => {
    expect(buildPageItems(1, 0)).toEqual([]);
  });
});

describe("pageRange", () => {
  it("calcula el rango visible de la página", () => {
    expect(pageRange(1, 25, 140)).toEqual({ start: 1, end: 25 });
    expect(pageRange(6, 25, 140)).toEqual({ start: 126, end: 140 });
    expect(pageRange(1, 25, 0)).toEqual({ start: 0, end: 0 });
  });
});
