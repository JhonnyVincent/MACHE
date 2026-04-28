import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

const locales = ["fr", "en", "es", "ar", "ht"];
const defaultLocale = "fr";

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
