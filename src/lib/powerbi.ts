import "server-only";
import { getCredential } from "@/lib/credentials";

// The embed URL itself isn't secret ("Publish to web" / embed links are
// accessible to anyone with the link) but is admin-managed via api_credentials.
export async function getPowerBiEmbedUrl(): Promise<string | null> {
  return getCredential("POWERBI_EMBED_URL");
}
