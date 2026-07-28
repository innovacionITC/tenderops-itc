"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ItcInput } from "@/components/itc";
import { Checkbox } from "@/components/ui/checkbox";
import type { PickerItem } from "./catalog-picker";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Variante de CatalogPicker para catálogos grandes (p. ej. ~1.100 ciudades):
 * en lugar de recibir todos los items, busca bajo demanda contra el servidor
 * (debounce + descarte de respuestas fuera de orden) y solo conoce las
 * etiquetas de lo seleccionado y de la página de resultados actual.
 */
export function AsyncCatalogPicker({
  title,
  selected,
  onToggle,
  search,
  minChars = 2,
  placeholder = "Buscar…",
  resultLimit,
}: {
  title: string;
  selected: PickerItem[];
  onToggle: (item: PickerItem) => void;
  search: (query: string) => Promise<PickerItem[]>;
  minChars?: number;
  placeholder?: string;
  /** Si la búsqueda devuelve exactamente este número, se avisa que hay más resultados. */
  resultLimit?: number;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      requestSeq.current += 1; // invalida respuestas pendientes al desmontar
    };
  }, []);

  const runSearch = (q: string) => {
    const seq = ++requestSeq.current;
    setIsSearching(true);
    search(q)
      .then((items) => {
        if (requestSeq.current !== seq) return; // llegó tarde: descartar
        setResults(items);
      })
      .catch(() => {
        if (requestSeq.current !== seq) return;
        setResults([]);
      })
      .finally(() => {
        if (requestSeq.current === seq) setIsSearching(false);
      });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < minChars) {
      requestSeq.current += 1; // cancela búsquedas en vuelo
      setResults([]);
      setIsSearching(false);
      return;
    }
    timer.current = setTimeout(() => runSearch(q), SEARCH_DEBOUNCE_MS);
  };

  const selectedIds = new Set(selected.map((s) => s.id));
  const visibleResults = results.filter((r) => !selectedIds.has(r.id));

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{selected.length} seleccionados</span>
      </div>
      <ItcInput
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        loading={isSearching}
        className="mb-2"
      />
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {selected.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50"
          >
            <Checkbox checked onCheckedChange={() => onToggle(item)} />
            <span className="truncate">{item.label}</span>
            <X className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
          </label>
        ))}
        {selected.length > 0 && visibleResults.length > 0 && <div className="my-1 border-t" />}
        {visibleResults.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50"
          >
            <Checkbox checked={false} onCheckedChange={() => onToggle(item)} />
            <span className="truncate">{item.label}</span>
          </label>
        ))}
        {query.trim().length < minChars && selected.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">
            Escribe al menos {minChars} letras para buscar.
          </p>
        )}
        {query.trim().length >= minChars && !isSearching && results.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">Sin resultados.</p>
        )}
        {resultLimit !== undefined && results.length >= resultLimit && (
          <p className="p-2 text-xs text-muted-foreground">
            Mostrando los primeros {resultLimit} resultados; refina la búsqueda para ver más.
          </p>
        )}
      </div>
    </div>
  );
}
