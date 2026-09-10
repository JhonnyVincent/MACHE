import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  getSupabaseCredentials,
  missingSupabaseEnvMessage
} from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

const locales = ["fr", "en", "es", "ar", "ht"];
const defaultLocale = "fr";

let warnedAboutMissingEnv = false;

function detectLocale(request: NextRequest) {
  const savedLocale = request.cookies.get("mache_locale")?.value;

  if (savedLocale && locales.includes(savedLocale)) {
    return savedLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  const preferred = acceptLanguage?.split(",")[0]?.split("-")[0];

  if (preferred && locales.includes(preferred)) {
    return preferred;
  }

  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const locale = detectLocale(request);

  response.cookies.set("mache_locale", locale, {
    path: "/",
    sameSite: "lax"
  });

  const credentials = getSupabaseCredentials();

  if (!credentials) {
    // Sans session rafraîchie ici, auth.getUser() renvoie null dans les
    // Server Components : les pages protégées renvoient vers /login, qui
    // renvoie vers le dashboard -> boucle de redirection. On le signale
    // au lieu de sortir en silence.
    if (!warnedAboutMissingEnv) {
      warnedAboutMissingEnv = true;
      console.warn(`[middleware] ${missingSupabaseEnvMessage("middleware")}`);
    }

    return response;
  }

  const supabase = createServerClient(credentials.url, credentials.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        response.cookies.set("mache_locale", locale, {
          path: "/",
          sameSite: "lax"
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)"
  ]
};
