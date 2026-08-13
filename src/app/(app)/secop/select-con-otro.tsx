"use client";

import { useState, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";

const TODOS = "todos";
const OTRO = "__otro__";

export { TODOS, OTRO };

export function SelectConOtro({
  label,
  value,
  opciones,
  placeholderTodos,
  onChange,
}: {
  label: string;
  value: string;
  opciones: string[];
  placeholderTodos: string;
  onChange: (value: string) => void;
}) {
  const esValorLibre = value !== "" && !opciones.includes(value);
  const [mostrarOtro, setMostrarOtro] = useState(esValorLibre);
  const [otroTexto, setOtroTexto] = useState(esValorLibre ? value : "");

  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      {mostrarOtro ? (
        <div className="flex gap-1.5">
          <ItcInput
            autoFocus
            value={otroTexto}
            placeholder="Escribir valor…"
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
              setOtroTexto(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onChange(otroTexto.trim());
              }
            }}
          />
          <ItcButton
            type="button"
            variant="secondary"
            title="Volver a la lista"
            onClick={() => {
              setMostrarOtro(false);
              setOtroTexto("");
              onChange("");
            }}
          >
            <X className="h-4 w-4" />
          </ItcButton>
        </div>
      ) : (
        <ItcInput
          type="select"
          value={value || TODOS}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const v = e.target.value;
            if (v === OTRO) {
              setMostrarOtro(true);
              return;
            }
            onChange(v === TODOS ? "" : v);
          }}
        >
          <option value={TODOS}>{placeholderTodos}</option>
          {opciones.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={OTRO}>Otro (escribir)…</option>
        </ItcInput>
      )}
    </div>
  );
}
