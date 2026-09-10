import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getSupabaseCredentials, missingSupabaseEnvMessage } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const credentials = getSupabaseCredentials();

  if (!credentials) {
    throw new Error(missingSupabaseEnvMessage("serveur"));
  }

  return createServerClient(credentials.url, credentials.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Peut arriver dans un Server Component.
          // Le middleware/callback doit aussi gérer les cookies.
        }
      }
    }
  });
}
