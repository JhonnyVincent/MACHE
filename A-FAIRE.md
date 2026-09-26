# MACHÉ — ce qui est fait, ce qui attend

Dernière mise à jour : 26 septembre 2026.
Cochez au fur et à mesure. Rien ici n'est « presque fait » : c'est fait, ou c'est dans la liste.

---

## ✅ Terminé et en ligne

- **Promotions financées par MACHÉ** — la commission est réduite de la part que MACHÉ finance ; écran admin *Promotions*.
- **Espace administrateur** — gel des versements (fraude), blocage d'un client, suspension d'un agent, points de retrait, promotions.
- **Connexion vendeur réparée** — nom de boutique normalisé ; « mot de passe incorrect » n'est plus affiché quand c'est le serveur qui dort.
- **Sécurité** — plafond de tentatives de connexion, six en-têtes de protection, middleware enfin actif (il n'avait jamais tourné), séparation public / admin par `MACHE_ROLE`.
- **Faille HAUTE `postcss` corrigée** (Puck laissé volontairement : faille inatteignable, correctif = régression).
- **Supabase et Vercel retirés du code.**
- **Accueil** — une seule porte de connexion ; bandeau rouge sur les vraies promotions (disparaît s'il n'y en a pas) ; damier Partenaires / Nouveautés / Plus vendus / Rayons ; « Plus vendus » ne classe qu'à partir de 12 ventes réelles.
- **BAWON** — nommé et lié sur la page Partenaires et sur l'accueil.

## 🟡 Commencé, pas branché

- [ ] **Règle de versement (2 signatures + 15 / 25 jours)** — la règle et la base sont prêtes et testées, mais **les routes ne l'appellent pas encore**. Reste à faire :
  - [ ] poser la date limite à la remise (Haïti) et à l'expédition (transporteur) ;
  - [ ] bouton « J'ai bien reçu » pour l'acheteur, sur toutes les livraisons ;
  - [ ] tâche planifiée qui libère les versements échus.

## ⚠️ Correction à connaître

- [ ] **Les rayons « Fait à la main », « Fait maison », « Bio et naturel » n'existent pas encore dans le catalogue.** Ils sont dans la liste du site (formulaire produit, filtres), mais pas dans le backend : ils **n'apparaîtront pas sur l'accueil** tant qu'ils n'y sont pas créés. → les créer depuis le panneau admin Medusa, ou me demander de les ajouter au script d'installation.

## ⏸️ Proposé, en attente de votre feu vert

- [ ] **Grand livre + fiche mensuelle** par vendeur (sert dès aujourd'hui : ce que chaque vendeur doit en commission). Défauts retenus sauf avis contraire : mois calendaire, taux de change figé à la commande.
- [ ] **Supprimer le faux Stripe** (`src/lib/payments/index.ts`) — il répond « payé » sans rien encaisser. *Demandé deux fois, attend votre oui.*
- [ ] **Protéger le panneau admin Medusa du backend** — jugé le chantier de sécurité le plus rentable restant.

## 🔒 Bloqué par une décision de votre côté

- [ ] **Paiements : Pay'm (Haïti) + Stripe (le reste)** — décidé. **Bloqué par la LLC américaine** : Stripe exige une société dans un pays supporté.
- [ ] **Juriste** — ce qu'une LLC a le droit de faire en détenant l'argent des vendeurs. Plus un **compte bancaire séparé** pour cet argent.
- [ ] **Transporteur Haïti → étranger** — chemin critique : sans lui, un acheteur aux États-Unis paie et ne reçoit rien. *(Votre phrase sur « pas en lot, par quantités » : je ne l'ai pas comprise, à me réexpliquer.)*
- [ ] **Récupération de mot de passe** — n'existe pas ; demande un service d'envoi d'e-mails.
- [ ] **Pièces d'identité des vendeurs** — 4 décisions : où les stocker, chiffrées ou non, qui peut les ouvrir, combien de temps.
- [ ] **Vrai domaine pour BAWON** — `bawon-plus-site.vercel.app` affiche « vercel.app » sur votre accueil.

## 🛠️ À lancer une fois sur le serveur (au déploiement)

- [ ] `npx medusa db:migrate` — nouvelles colonnes (gel des versements, délais de versement).
- [ ] `npx medusa exec ./src/scripts/agent-groups.ts` — crée les groupes agents / suspendus / bloqués.

## ❓ À trancher, petit

- [ ] Remettre un lien « S'inscrire » dans l'en-tête ? (réduit à une seule porte « Mon compte »)
