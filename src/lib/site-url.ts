/*
  L'adresse publique du site, telle qu'elle doit apparaître dans un
  e-mail.

  Supabase envoie des liens : confirmation d'inscription, code de
  connexion, réinitialisation de mot de passe. Chacun porte un jeton qui
  ouvre une session. L'adresse vers laquelle ce lien pointe doit donc
  être le site lui-même, et rien d'autre.

  Ce qui existait

  Deux actions se rabattaient sur « https://mache-two.vercel.app » écrit
  en dur — un ancien déploiement. Si NEXT_PUBLIC_SITE_URL n'était pas
  renseignée et que l'en-tête `origin` manquait, le lien de
  réinitialisation partait donc vers un domaine que MACHÉ ne contrôle
  pas, avec son jeton. Quiconque tient ce domaine tient le compte.

  Ce qui remplace

  Trois sources, dans l'ordre : la variable, l'en-tête `origin`, puis
  l'hôte de la requête. La dernière suffit dans tous les cas : une
  requête arrive toujours avec l'hôte par lequel on a joint le site.
  Aucune adresse écrite en dur.
*/

import { headers } from "next/headers";

export async function siteOrigin(): Promise<string> {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();

  if (configured) return configured.replace(/\/+$/, "");

  const headersList = await headers();

  const origin = headersList.get("origin");

  if (origin) return origin.replace(/\/+$/, "");

  const host = headersList.get("host");

  /*
    En développement, l'hôte est localhost et le protocole http. Partout
    ailleurs, https : un lien de connexion en clair exposerait son jeton
    sur le réseau.
  */
  if (host) {
    const scheme = host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";

    return `${scheme}://${host}`;
  }

  /*
    Ni variable, ni en-tête : on ne devine pas. Renvoyer une adresse
    inventée enverrait le jeton chez quelqu'un d'autre ; une chaîne vide
    fait échouer l'envoi, ce qui se voit et se corrige.
  */
  return "";
}
