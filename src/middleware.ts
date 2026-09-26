/*
  MIDDLEWARE : ce que ce déploiement a le droit de servir, et la langue.

  IL N'A JAMAIS TOURNÉ JUSQU'ICI

  Il vivait à la racine du dépôt alors que l'application est dans
  `src/`. Next le cherche alors dans `src/` : il n'était pas compilé du
  tout — la construction ne mentionnait aucun « Middleware », et le
  fichier n'apparaissait nulle part dans `.next/`. Constaté en le
  déplaçant : la ligne « ƒ Middleware » est apparue.

  CE QUI EN A ÉTÉ RETIRÉ, ET POURQUOI

  Il rafraîchissait aussi une session Supabase. Ce code n'a donc jamais
  servi — et le réveiller tel quel aurait été pire que de le laisser
  dormir : le projet Supabase a été supprimé, mais des variables
  héritées d'un ancien déploiement suffisent à le faire passer pour
  configuré. Chaque page aurait alors attendu un appel réseau vers un
  hôte qui ne répond plus. L'erreur était attrapée ; l'attente, non.

  Les quelques pages qui touchent encore Supabase vérifient elles-mêmes
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
/* QUEL RÔLE JOUE CE DÉPLOIEMENT                                              */
/* -------------------------------------------------------------------------- */

/*
  UN SEUL CODE, DEUX SERVICES.

  Le même dépôt, la même branche, le même code tournent deux fois chez
  l'hébergeur. Une variable d'environnement dit à chaque service ce
  qu'il a le droit de servir :

  - « public » : tout, SAUF l'espace d'administration, qui répond 404
    comme s'il n'existait pas ;
  - « admin » : UNIQUEMENT l'espace d'administration ;
  - absent : tout, c'est-à-dire exactement ce que fait le site
    aujourd'hui.

  POURQUOI LE DÉFAUT EST « TOUT »

  Parce qu'un défaut qui coupe casse. Si cette variable manquait sur le
  déploiement actuel et que le défaut était « public », l'espace
  d'administration disparaîtrait au premier envoi — sans que personne
  n'ait rien demandé. Une variable nouvelle ne doit rien changer tant
  qu'on ne l'a pas posée.

  CE QUE ÇA PROTÈGE, ET CE QUE ÇA NE PROTÈGE PAS

  Ça protège de ce qu'on ne trouve pas : les robots qui balaient
  internet essaient /admin, /dashboard, /wp-admin sur tous les sites
  qu'ils croisent. Sur le domaine public, ils ne trouveront rien — donc
  ils n'essaieront aucun mot de passe.

  Ça ne remplace AUCUNE authentification. Qui a le mot de passe et le
  code à six chiffres entre, quelle que soit l'adresse. Le contrôle
  refait à chaque page — `getAdminUser()` — reste la vraie serrure ;
  ceci ne fait que retirer la porte du trottoir.

  Et ça ne protège pas le backend : Medusa sert son propre panneau
  ailleurs, et ce partage-ci ne déplace que les écrans de MACHÉ.
*/

const ADMIN_PREFIX = "/dashboard/admin";

type Role = "public" | "admin" | "tout";

function deploymentRole(): Role {
  const raw = (process.env.MACHE_ROLE ?? "").trim().toLowerCase();

  if (raw === "public") return "public";
  if (raw === "admin") return "admin";

  /* Non renseigné, ou valeur inconnue : le comportement d'aujourd'hui. */
  return "tout";
}

/*
  Un 404 nu, sans page ni indice.

  On ne rend pas la jolie page « introuvable » du site : elle porte
  l'en-tête, le menu, le nom de MACHÉ. Sur le service d'administration,
  qui répond à une adresse que personne ne doit deviner, autant ne rien
  dire du tout. Et pour un robot, 404 est 404.
*/
function introuvable() {
  return new NextResponse(null, { status: 404 });
}

/*
  Rend une réponse quand ce déploiement n'a pas le droit de servir cette
  adresse, et `null` quand il l'a.

  Placé AVANT la langue et la session : inutile de rafraîchir une
  session pour une requête qu'on s'apprête à refuser.
*/
function refuseHorsRole(request: NextRequest) {
  const role = deploymentRole();

  if (role === "tout") return null;

  const { pathname } = request.nextUrl;

  const versAdmin =
    pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);

  if (role === "public") {
    /* L'espace d'administration n'existe pas sur le domaine public. */
    return versAdmin ? introuvable() : null;
  }

  /* role === "admin" : rien d'autre que l'administration. */
  if (versAdmin) return null;

  /*
    La racine mène à l'espace, par confort : quelqu'un de l'équipe qui
    tape l'adresse du service sans le chemin arrive où il va.
  */
  if (pathname === "/") {
    return NextResponse.redirect(new URL(ADMIN_PREFIX, request.url));
  }

  return introuvable();
}

export async function middleware(request: NextRequest) {
  const refus = refuseHorsRole(request);

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
