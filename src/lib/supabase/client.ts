import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseCredentials, missingSupabaseEnvMessage } from "./env";

let browserClient: SupabaseClient | null = null;

/*
  Client navigateur paresseux (singleton).

  À n'appeler que depuis un effet ou un gestionnaire d'évènement : appelé
  pendant le rendu, il faisait échouer le prerender de /reset-password au
  build ("Supabase config manquante côté client") et recréait un client à
  chaque rendu, ce qui relançait en boucle les effets qui en dépendent.
*/
export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const credentials = getSupabaseCredentials();

  if (!credentials) {
    throw new Error(missingSupabaseEnvMessage("client"));
  }

  browserClient = createBrowserClient(credentials.url, credentials.key);

  return browserClient;
}
