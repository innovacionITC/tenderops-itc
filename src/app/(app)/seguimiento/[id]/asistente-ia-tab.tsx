"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { iniciarSesionAsistenteIa, refrescarSesionAsistenteIa } from "./asistente-ia-actions";

type Sesion = {
  conversationId: string;
  token: string;
  expiresIn: number;
  fromId: string;
  startedAt: number;
};

type ChatMessage = {
  id: string;
  text: string;
  fromBot: boolean;
  timestamp: Date;
};

const TOKEN_REFRESH_MARGIN_MS = 60_000;

export function AsistenteIaTab({
  procesoId,
  directLineBaseUrl,
}: {
  procesoId: string;
  directLineBaseUrl: string;
}) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pollError, setPollError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollFailuresRef = useRef(0);

  tokenRef.current = sesion?.token ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshToken = useCallback(async () => {
    if (!sesion || !tokenRef.current) return;
    try {
      const result = await refrescarSesionAsistenteIa(procesoId, tokenRef.current);
      setSesion((prev) =>
        prev
          ? { ...prev, token: result.token, expiresIn: result.expiresIn, startedAt: Date.now() }
          : null,
      );
    } catch {
      toast.error("La sesión del asistente expiró. Inicia una nueva sesión.");
      setSesion(null);
    }
  }, [sesion, procesoId]);

  useEffect(() => {
    if (!sesion) return;

    const refreshMs = Math.max(
      (sesion.expiresIn * 1000) - TOKEN_REFRESH_MARGIN_MS,
      30_000,
    );
    const timeout = setTimeout(() => {
      void refreshToken();
    }, refreshMs);

    return () => clearTimeout(timeout);
  }, [sesion, refreshToken]);

  useEffect(() => {
    if (!sesion) return;

    const interval = setInterval(async () => {
      try {
        const token = tokenRef.current;
        if (!token) return;
        const url = `${directLineBaseUrl}/v3/directline/conversations/${sesion.conversationId}/activities${watermarkRef.current ? `?watermark=${watermarkRef.current}` : ""}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Direct Line respondió ${res.status}`);
        }
        const data = await res.json();
        watermarkRef.current = data.watermark ?? watermarkRef.current;

        const newMessages: ChatMessage[] = [];
        for (const a of data.activities ?? []) {
          if (a.type !== "message") continue;
          if (a.from.id === sesion.fromId) continue;
          if (messages.some((m) => m.id === a.id)) continue;
          newMessages.push({
            id: a.id,
            text: a.text ?? "",
            fromBot: true,
            timestamp: new Date(a.timestamp ?? Date.now()),
          });
        }
        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
        }

        pollFailuresRef.current = 0;
        setPollError((prev) => (prev ? false : prev));
      } catch (e) {
        pollFailuresRef.current += 1;
        // Solo se avisa tras fallos consecutivos: un timeout/parpadeo aislado
        // de red no debe alarmar al usuario, pero una racha sí es real.
        if (pollFailuresRef.current === 3) {
          console.error("[asistente-ia] fallo de polling repetido", e);
          setPollError(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sesion, messages, directLineBaseUrl]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const data = await iniciarSesionAsistenteIa(procesoId);
      setSesion({ ...data, startedAt: Date.now() });
      setMessages([]);
      watermarkRef.current = null;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al iniciar sesión");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSend = async () => {
    if (!sesion || !input.trim()) return;
    const text = input.trim();
    setInput("");
    setIsSending(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text,
        fromBot: false,
        timestamp: new Date(),
      },
    ]);

    try {
      const token = tokenRef.current;
      if (!token) throw new Error("Sesión expirada");
      await fetch(
        `${directLineBaseUrl}/v3/directline/conversations/${sesion.conversationId}/activities`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "message",
            from: { id: sesion.fromId },
            text,
          }),
        },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar mensaje");
    } finally {
      setIsSending(false);
    }
  };

  if (!sesion) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-muted-foreground">
          Inicia una sesión para chatear con el asistente IA.
        </p>
        <ItcButton onClick={handleStart} disabled={isStarting}>
          {isStarting ? "Iniciando…" : "Iniciar sesión"}
        </ItcButton>
      </div>
    );
  }

  return (
    <div className="flex h-96 flex-col">
      <div className="flex-1 overflow-y-auto space-y-3 p-2">
        {pollError && (
          <p className="text-center text-xs text-destructive">
            Problemas de conexión con el asistente. Reintentando…
          </p>
        )}
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Escribe un mensaje para iniciar la conversación.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              m.fromBot
                ? "bg-muted text-foreground"
                : "bg-primary text-primary-foreground ml-auto"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 border-t pt-2">
        <ItcInput
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Escribe un mensaje…"
        />
        <ItcButton onClick={handleSend} disabled={isSending || !input.trim()}>
          Enviar
        </ItcButton>
      </div>
    </div>
  );
}
