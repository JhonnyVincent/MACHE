/*
  Le script de statistiques, seulement si un jeton valide est posé.
  Voir src/lib/analytics.ts.

  Le jeton est vérifié (forme stricte) avant d'être écrit dans la page :
  une valeur mal collée dans Render ne peut rien injecter.
*/

import Script from "next/script";
import { analyticsToken } from "@/lib/analytics";

export function Analytics() {
  const token = analyticsToken();

  if (!token) return null;

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
