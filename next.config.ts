import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para exponer `next dev` por ngrok: sin esto, Next bloquea el
  // websocket de HMR (/_next/webpack-hmr) por venir de un origin distinto al
  // host con el que arrancó el server (ver allowedDevOrigins).
  allowedDevOrigins: ["*.ngrok-free.app"],
  experimental: {
    // 26 MB = MAX_FILE_BYTES (25 MB) + 1 MB de margen para el resto del FormData.
    // Mantener sincronizado con schema.ts → MAX_FILE_BYTES y el [RequestSizeLimit] del backend.
    serverActions: { bodySizeLimit: "26mb" },
  },
};

export default nextConfig;
