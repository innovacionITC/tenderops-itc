import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 26 MB = MAX_FILE_BYTES (25 MB) + 1 MB de margen para el resto del FormData.
    // Mantener sincronizado con schema.ts → MAX_FILE_BYTES y el [RequestSizeLimit] del backend.
    serverActions: { bodySizeLimit: "26mb" },
  },
};

export default nextConfig;
