/*
  Résolution centralisée des variables d'environnement Supabase.

  Le projet a accumulé plusieurs noms pour les mêmes valeurs
  (NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, *_PUBLISHABLE_KEY...).
  Chaque fichier en acceptait un sous-ensemble différent : le serveur
  démarrait alors que le middleware, lui, ne trouvait rien et sautait
  silencieusement le rafraîchissement de session — ce qui provoquait la
  boucle de redirection /dashboard/seller -> /login -> /dashboard/seller.

  Tout passe désormais par ce module. Les accès à process.env sont écrits
  en toutes lettres : Next.js n'inline les NEXT_PUBLIC_* dans le bundle
  navigateur que si la clé est statiquement analysable.
*/

export type SupabaseCredentials = {
  url: string;
  key: string;
};

export function resolveSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  );
}

export function resolveSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ""
  );
}

/** Renvoie les identifiants, ou null si l'un des deux manque. */
export function getSupabaseCredentials(): SupabaseCredentials | null {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseKey();

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

/** Message d'erreur explicite, réutilisé côté serveur et côté client. */
export function missingSupabaseEnvMessage(scope: "serveur" | "client" | "middleware") {
  const missing = [
    resolveSupabaseUrl() ? null : "NEXT_PUBLIC_SUPABASE_URL",
    resolveSupabaseKey() ? null : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  return `Configuration Supabase manquante (${scope}) : ${missing.join(
    ", "
  )}. Ajoutez ces variables dans .env.local (voir .env.example) puis redémarrez le serveur.`;
}
