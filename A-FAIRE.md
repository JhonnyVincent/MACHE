# MACHÉ — ce qui est fait, ce qui attend

Dernière mise à jour : 26 septembre 2026.
Cochez au fur et à mesure. Rien ici n'est « presque fait » : c'est fait, ou c'est dans la liste.

---

## 👉 À faire de votre côté, dans cet ordre (sur Render, sans terminal)

0. [ ] **La branche de déploiement — AVANT TOUT.** `main` a été supprimée. Sur **chacun des deux services** Render (`mache-backend` et le site) : `Settings` → `Build & Deploy` → `Branch` → choisir **`claude/quirky-bardeen-9fp6v4`**. Tant qu'un service vise `main`, il garde sa dernière version et **aucune correction ne l'atteint** — sans message d'erreur.
1. [ ] **Vérifier que le backend s'est redéployé** après le dernier envoi (`mache-backend` → *Events*). Sinon : **Manual Deploy**. C'est ce redéploiement qui reconstruit le panneau vendeur et met fin au « Failed to fetch ».
2. [ ] **Compte d'administration** — `mache-backend` → *Environment* : poser `ADMIN_EMAIL` et `ADMIN_PASSWORD` (8 caractères minimum), puis **Manual Deploy**. Le compte est créé au démarrage. Il ouvre `/dashboard/admin` sur le site **et** le panneau `/dashboard` du backend. Ensuite, **retirer `ADMIN_PASSWORD`** : le compte reste.
3. [ ] **Envoi des e-mails (mot de passe oublié)** — compte gratuit sur brevo.com → *Expéditeurs* : ajouter `contact.bawonlakwa@gmail.com` et cliquer le lien de confirmation → *SMTP & API → Clés API* : créer une clé → la coller dans `BREVO_API_KEY` sur `mache-backend`. Détails : `DEPLOIEMENT.md`, « L'envoi des e-mails ».
4. [ ] **Facultatif** — retirer `MERCUR_BACKEND_URL` de `mache-backend` : elle ne sert plus.

## ✅ Terminé et en ligne

- **Panneau vendeur : fin du « Failed to fetch »** — il visait `localhost:9000` ; il appelle désormais l'adresse qui l'affiche. Vérifié dans un navigateur, jusqu'à la liste des boutiques.
- **Connexion : une majuscule ne refuse plus le compte** — « Jean@… » et « jean@… », c'est la même adresse, partout (site, panneaux Mercur). Les anciens comptes à majuscules sont alignés au démarrage.
- **Mot de passe oublié** — client, vendeur (site et panneau Mercur), administration. Lien valable 15 min, utilisable une fois ; 3 demandes max par adresse et par heure ; le site ne révèle jamais qui a un compte. *Attend la clé Brevo (étape 3 ci-dessus).*
- **Les rayons de MACHÉ existent dans le catalogue** — 15 rayons, 37 sous-rayons, dont Fait à la main, Fait maison, Bio et naturel. Créés au démarrage, sans rien à faire.
- **Accueil** — une seule porte de connexion ; bandeau rouge sur les vraies promotions ; damier Partenaires / Nouveautés / Plus vendus / rayons de MACHÉ (fait main, fait maison et bio en tête) ; « Plus vendus » n'apparaît qu'à partir de 12 ventes réelles.
- **BAWON** — nommé et lié sur la page Partenaires et sur l'accueil.
- **Promotions financées par MACHÉ** — la commission est réduite de la part que MACHÉ finance ; écran admin *Promotions*.
- **Espace administrateur** — gel des versements (fraude), blocage d'un client, suspension d'un agent, points de retrait, promotions.
- **Sécurité** — plafond de tentatives de connexion (et il ne se contourne plus en inventant une adresse IP), six en-têtes de protection, middleware actif, séparation public / admin par `MACHE_ROLE`.
- **Faille HAUTE `postcss` corrigée** (Puck laissé volontairement : faille inatteignable, correctif = régression).
- **Supabase et Vercel retirés du code.**
- **Automatique à chaque démarrage** (plus rien à lancer à la main) : migrations de la base, groupes d'agents, rayons, alignement des adresses e-mail, compte d'administration.

## 🟡 Commencé, pas branché

- [ ] **Règle de versement (2 signatures + 15 / 25 jours)** — la règle et la base sont prêtes et testées, mais **les routes ne l'appellent pas encore**. Reste à faire :
  - [ ] poser la date limite à la remise (Haïti) et à l'expédition (transporteur) ;
  - [ ] bouton « J'ai bien reçu » pour l'acheteur, sur toutes les livraisons ;
  - [ ] tâche planifiée qui libère les versements échus.

## ⏸️ Proposé, en attente de votre feu vert

- [ ] **Grand livre + fiche mensuelle** par vendeur (sert dès aujourd'hui : ce que chaque vendeur doit en commission). Défauts retenus sauf avis contraire : mois calendaire, taux de change figé à la commande.
- [ ] **Supprimer le faux Stripe** (`src/lib/payments/index.ts`) — il répond « payé » sans rien encaisser. *Demandé trois fois, attend votre oui.*
- [ ] **Retirer le catalogue de démonstration** — chaussures fictives en euros, 3 boutiques de démonstration, 20 rayons en anglais. Il remplit encore « Nouveautés ». À faire avant d'ouvrir à de vrais clients.
- [ ] **Une seule connexion pour MACHÉ et le panneau vendeur** — aujourd'hui, deux connexions avec les mêmes identifiants (deux adresses différentes, deux sessions). Faisable, à construire proprement.
- [ ] **Protéger le panneau admin Medusa du backend** — jugé le chantier de sécurité le plus rentable restant.
- [ ] **Transmettre au backend l'adresse IP réelle des internautes** — le site appelle le backend depuis son propre serveur : pour le backend, tous les clients du site ont la même adresse. Conséquence : les plafonds ne peuvent pas distinguer deux clients passés par le site.

## 🔒 Bloqué par une décision de votre côté

- [ ] **Paiements : Pay'm (Haïti) + Stripe (le reste)** — décidé. **Bloqué par la LLC américaine** : Stripe exige une société dans un pays supporté.
- [ ] **Juriste** — ce qu'une LLC a le droit de faire en détenant l'argent des vendeurs. Plus un **compte bancaire séparé** pour cet argent.
- [ ] **Transporteur Haïti → étranger** — chemin critique : sans lui, un acheteur aux États-Unis paie et ne reçoit rien. *(Votre phrase sur « pas en lot, par quantités » : je ne l'ai pas comprise, à me réexpliquer.)*
- [ ] **Nom de domaine à MACHÉ** — pour les e-mails (une adresse @gmail.com envoyée par Brevo tombe plus souvent dans les indésirables) et pour le site.
- [ ] **Pièces d'identité des vendeurs** — 4 décisions : où les stocker, chiffrées ou non, qui peut les ouvrir, combien de temps.
- [ ] **Vrai domaine pour BAWON** — `bawon-plus-site.vercel.app` affiche « vercel.app » sur votre accueil.

## ❓ À trancher, petit

- [ ] Remettre un lien « S'inscrire » dans l'en-tête ? (réduit à une seule porte « Mon compte »)
- [ ] Si les journaux du backend signalent **des comptes « qui ne diffèrent que par les majuscules »** : deux comptes distincts pour la même personne, à départager à la main.
