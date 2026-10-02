/*
  MIDDLEWARE : l'administration absente du site, et la langue.

  IL N'A JAMAIS TOURNÉ JUSQU'ICI

  Il vivait à la racine du dépôt alors que l'application est dans
  `src/`. Next le cherche alors dans `src/` : il n'était pas compilé du
  tout — la construction ne mentionnait aucun « Middleware », et le
  fichier n'apparaissait nulle part dans `.next/`. Constaté en le
  déplaçant : la ligne « ƒ Middleware » est apparue.

  CE QUI EN A ÉTÉ RETIRÉ, ET POURQUOI

  Il rafraîchissait aussi une session d'un service distant. Ce code n'a donc jamais
  servi — et le réveiller tel quel aurait été pire que de le laisser
  dormir : l'ancien socle de comptes a été supprimé, mais des variables
  héritées d'un ancien déploiement suffisent à le faire passer pour
  configuré. Chaque page aurait alors attendu un appel réseau vers un
  hôte qui ne répond plus. L'erreur était attrapée ; l'attente, non.

  Les quelques pages qui touchaient encore ce service vérifient elles-mêmes
  sa présence et se dégradent proprement. Elles n'ont pas besoin de ce
  rafraîchissement.

  Ne restent donc que deux choses, toutes deux locales et instantanées.
*/

import { NextResponse, type NextRequest } from "next/server";

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

/* -------------------------------------------------------------------------- */
/* L'ADMINISTRATION N'EST PAS SUR CE SITE                                     */
/* -------------------------------------------------------------------------- */

/*
  L'administration de MACHE est le panneau du backend (`/dashboard` sur
  l'adresse du backend, qui n'est écrite nulle part sur le site). Les
  anciennes adresses `/dashboard/admin…` ne mènent donc plus à rien :
  elles répondent 404 nu, sans page ni indice — pas même le nom de MACHE.

  Pour un robot qui balaie /admin, /dashboard, /wp-admin sur tous les
  sites qu'il croise, il n'y a rien à trouver ici.
*/
const ADMIN_PREFIX = "/dashboard/admin";

function refuseAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const refus = refuseAdmin(request);

  if (refus) return refus;

  const response = NextResponse.next({ request });

  response.cookies.set("mache_locale", detectLocale(request), {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
