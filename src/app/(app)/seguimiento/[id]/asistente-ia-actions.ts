"use server";

import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

type SesionResponse = {
  conversationId: string;
  token: string;
  expiresIn: number;
  streamUrl: string | null;
  fromId: string;
};

type TokenRefreshResponse = {
  token: string;
  expiresIn: number;
};

export async function iniciarSesionAsistenteIa(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  return apiFetch<SesionResponse>(`/procesos-seguimiento/${id}/asistente-ia/sesion`, {
    method: "POST",
  });
}

export async function refrescarSesionAsistenteIa(procesoId: string, token: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  return apiFetch<TokenRefreshResponse>(`/procesos-seguimiento/${id}/asistente-ia/sesion/refrescar`, {
    method: "POST",
    body: { token },
  });
}
