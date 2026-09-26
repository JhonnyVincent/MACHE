/*
  EN-TÊTES DE SÉCURITÉ.

  Ce sont des instructions que le serveur donne au navigateur : « refuse
  de faire ceci, même si la page te le demande ». Elles ne corrigent
  aucune faille en elles-mêmes ; elles retirent au navigateur le droit
  de se laisser abuser, ce qui ferme des catégories entières d'attaque
  d'un coup.

  Aucune n'est décorative — chacune répond à un scénario précis.
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        /* Toutes les pages. */
        source: "/:path*",
        headers: [
          /*
            NE PAS DEVINER LE TYPE D'UN FICHIER.

            Sans cela, un navigateur qui reçoit un fichier « image »
            dont le contenu ressemble à du HTML peut décider de
            l'exécuter comme une page. C'est exactement le chemin par
            lequel un document d'identité piégé se transformerait en
            vol de session, le jour où MACHÉ en recevra.
          */
          { key: "X-Content-Type-Options", value: "nosniff" },

          /*
            NE PAS SE FAIRE ENCADRER.

            Un site pirate affiche l'espace admin de MACHÉ dans un cadre
            invisible, par-dessus ses propres boutons : le dirigeant
            croit cliquer sur « accepter les cookies » et clique en
            réalité sur « résilier cette boutique ». C'est du clic
            détourné, et cela ne demande aucune faille dans MACHÉ.
          */
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },

          /*
            NE PAS RACONTER D'OÙ L'ON VIENT.

            Le lien de suivi d'un colis porte son jeton dans l'adresse :
            /suivi/<id>?jeton=... Si l'acheteur clique ensuite sur le
            lien du transporteur, le navigateur enverrait cette adresse
            complète — jeton compris — au site du transporteur, qui la
            garde dans ses journaux. Avec cette règle, il ne reçoit que
            le nom de domaine.
          */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          /*
            NE PAS DEMANDER LA CAMÉRA, LE MICRO NI LA POSITION.

            MACHÉ ne s'en sert nulle part. Le déclarer ferme la porte à
            un script injecté qui essaierait de les réclamer, et évite
            qu'un navigateur pose à un acheteur une question qui
            l'inquiétera à raison.
          */
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },

          /*
            TOUJOURS EN HTTPS, ET S'EN SOUVENIR.

            Sans cela, la toute première visite peut partir en clair —
            et c'est sur celle-là qu'on intercepte un mot de passe. Deux
            ans, sous-domaines compris.
          */
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
