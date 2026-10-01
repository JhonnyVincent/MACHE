# MACHE — ce qui est fait, ce qui attend

Dernière mise à jour : 30 septembre 2026.
Cochez au fur et à mesure.

📋 **La liste complète des corrections (20 points de contrôle + chaque profil : vendeur, acheteur, diaspora, grossiste, agent, admin) est dans [`CORRECTIONS.md`](CORRECTIONS.md).** Rien ici n'est « presque fait » : c'est fait, ou c'est dans la liste.

---

## 👉 À faire de votre côté, dans cet ordre (sur Render, sans terminal)

0. [ ] **La branche de déploiement — AVANT TOUT.** `main` a été supprimée. Sur **chacun des deux services** Render (`mache-backend` et le site) : `Settings` → `Build & Deploy` → `Branch` → choisir **`claude/quirky-bardeen-9fp6v4`**. Tant qu'un service vise `main`, il garde sa dernière version et **aucune correction ne l'atteint** — sans message d'erreur.
1. [ ] **Vérifier que le backend s'est redéployé** après le dernier envoi (`mache-backend` → *Events*). Sinon : **Manual Deploy**. C'est ce redéploiement qui reconstruit le panneau vendeur et met fin au « Failed to fetch ».
2. [ ] **Compte d'administration** — `mache-backend` → *Environment* : poser `ADMIN_EMAIL` et `ADMIN_PASSWORD` (8 caractères minimum), puis **Manual Deploy**. Le compte est créé au démarrage. Il ouvre `/dashboard/admin` sur le site **et** le panneau `/dashboard` du backend. Ensuite, **retirer `ADMIN_PASSWORD`** : le compte reste.
3. [ ] **Envoi des e-mails (mot de passe oublié)** — compte gratuit sur brevo.com → *Expéditeurs* : ajouter l'adresse d'expédition et cliquer le lien de confirmation → *SMTP & API → Clés API* : créer une clé → la coller dans `BREVO_API_KEY` sur `mache-backend`, et mettre **exactement la même adresse** dans `MAIL_FROM`. Détails : `DEPLOIEMENT.md`, « L'envoi des e-mails ».
4. [ ] **Abonnement « Restez au courant »** — dans Brevo : *Contacts → Listes* → créer une liste « Nouvelles MACHE », noter son numéro, le mettre dans `BREVO_NEWSLETTER_LIST_ID` sur `mache-backend`. Recommandé : créer un modèle de double confirmation et mettre son numéro dans `BREVO_DOI_TEMPLATE_ID`.
5. [ ] **Photos des rayons (tuiles « Catégories »)** — sur GitHub, dossier `public/images/rayons/` → *Add file → Upload files*. Une photo par sous-rayon, nommée d'après son adresse (`meubles.jpg`, `telephones-accessoires.jpg`, `huiles-essentielles.jpg`…) : la liste est dans le `LISEZ-MOI.md` du dossier. **Libres de droits uniquement** (Unsplash, Pexels) — pas pngtree ni images filigranées.
6. [ ] **Rester connecté au panneau vendeur (Redis)** — Render → *New* → **Key Value** → nom `mache-sessions`, offre **Free**, région **Frankfurt** → *Create*. Copier son **Internal Key Value URL** (`redis://…`) → `mache-backend` → *Environment* → `REDIS_URL` = cette adresse → *Save*. Sans cela, les vendeurs sont déconnectés à chaque fois que le backend s'endort (15 min sans visite).
7. [ ] **Nom de l'expéditeur des e-mails** — `mache-backend` → *Environment* → `MAIL_FROM_NAME` = `MACHE` (sans accent).
8. [ ] **Réseaux sociaux** — envoyer à Claude les adresses des pages MACHE (Facebook, Instagram, TikTok, WhatsApp, YouTube, X). Les logos n'apparaissent qu'une fois l'adresse donnée.
9. [ ] **Facultatif** — retirer `MERCUR_BACKEND_URL` de `mache-backend` : elle ne sert plus.
10. [ ] **Statistiques de visite (gratuit, sans cookie)** — créer un compte sur dash.cloudflare.com → *Analytics & Logs* → *Web Analytics* → *Add a site* → saisir l'adresse du site (`mache-1.onrender.com`) → choisir l'installation **par script JavaScript** → copier le **token** (32 caractères, dans `data-cf-beacon='{"token": "…"}'`). Sur Render, service **du site** → *Environment* → `CF_ANALYTICS_TOKEN` = ce token → *Save*. Les chiffres apparaissent dans Cloudflare au bout de quelques minutes.
11. [ ] **E-mails automatiques** — ils partent dès que `BREVO_API_KEY` et `MAIL_FROM` sont posées (étape 3). Facultatif : `ADMIN_ALERT_EMAIL` sur `mache-backend` pour recevoir les alertes (nouvelle boutique, nouveau message) ailleurs que sur `MAIL_FROM`. Vérifier que `STOREFRONT_URL` = l'adresse du site : les liens des e-mails en dépendent.
12. [ ] **Le jour du nom de domaine** — poser `NEXT_PUBLIC_SITE_URL` (ex. `https://mache.ht`) sur le service du site, puis déclarer `https://…/sitemap.xml` dans Google Search Console.

## ✅ Terminé et en ligne

- **Commander depuis l'étranger** — 21 pays de la diaspora. La commande se fait « sur confirmation » : frais d'expédition affichés « À confirmer », rien à payer tout de suite ; l'acheteur, le vendeur (« n'expédiez rien avant la confirmation ») et l'équipe reçoivent chacun leur e-mail. **À chaque commande internationale, l'équipe chiffre l'envoi et l'envoie au client** avec le moyen de paiement.
- **Page de commande** — e-mail et nom préremplis pour un client connecté, adresse qui reste affichée, modes de livraison en français, numéro de commande sur la confirmation.
- **Référencement et partage** — un vrai titre et une description sur chaque page, aperçu WhatsApp/Facebook (photo + prix sur les produits), icône du site, `sitemap.xml`, `robots.txt`, page 404 en français.
- **Site plus léger** — logo 1,2 Mo → 14 Ko, carte 1,2 Mo → 65 Ko, photos des rayons ÷ 3. Images chargées à la demande.
- **Contrastes** — textes pâles corrigés sur tout le site (pied de page, menus, rouge de la marque).
- **Anti-spam** — champ piège, délai minimum, plafond par connexion, sur les 5 formulaires publics. Sans captcha.
- **E-mails automatiques** — commandes (vendeur + acheteur), devis (demande + réponse), réponses de MACHE, boutique approuvée, alertes à l'équipe. *Attend la clé Brevo (étape 3).*
- **Statistiques** — prêtes, sans cookie. *Attend le jeton Cloudflare (étape 10).*

- **Panneau vendeur : fin du « Failed to fetch »** — il visait `localhost:9000` ; il appelle désormais l'adresse qui l'affiche. Vérifié dans un navigateur, jusqu'à la liste des boutiques.
- **Accueil, nouvel ordre** — Nouveautés (3 rangées de 6), Nouvelles boutiques en grandes cartes puis Nos suggestions, qui défilent de droite à gauche ; points relais en vert clair ; FAQ avant le pied de page (mêmes réponses que la page /faq). Tuiles des catégories : une case par sous-rayon, prête à recevoir sa photo.
- **Panneau vendeur : on reste connecté** — sessions de 3 jours prolongées à l'usage, rangées dans Redis : elles survivent aux réveils du backend. Vérifié avec le vrai backend (sans Redis : déconnecté au redémarrage ; avec : connecté). *Attend la création du Key Value (étape 6).*
- **Bande du haut** — « Trouver un fournisseur » ; logos des réseaux sociaux prêts (étape 8). Le nom s'écrit MACHE partout.
- **Panneau vendeur : une seule connexion** — « Ouvrir mon panneau vendeur » sur le site entre directement dans le panneau Mercur, dans la bonne boutique, sans redemander les identifiants (laissez-passer de 60 s, à usage unique). Vérifié avec le vrai backend et dans un navigateur.
- **Connexion : une majuscule ne refuse plus le compte** — « Jean@… » et « jean@… », c'est la même adresse, partout (site, panneaux Mercur). Les anciens comptes à majuscules sont alignés au démarrage.
- **Mot de passe oublié** — client, vendeur (site et panneau Mercur), administration. Lien valable 15 min, utilisable une fois ; 3 demandes max par adresse et par heure ; le site ne révèle jamais qui a un compte. *Attend la clé Brevo (étape 3 ci-dessus).*
- **Les rayons de MACHE existent dans le catalogue** — 15 rayons, 37 sous-rayons, dont Fait à la main, Fait maison, Bio et naturel. Créés au démarrage, sans rien à faire.
- **Accueil** — une seule porte de connexion ; bandeau rouge sur les vraies promotions ; damier Partenaires / Nouveautés / Plus vendus / rayons de MACHE (fait main, fait maison et bio en tête) ; « Plus vendus » n'apparaît qu'à partir de 12 ventes réelles.
- **BAWON** — nommé et lié sur la page Partenaires et sur l'accueil.
- **Promotions financées par MACHE** — la commission est réduite de la part que MACHE finance ; écran admin *Promotions*.
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

## ✅ Fait : grossistes, marques, comptes professionnels, panneau vendeur en français

- [x] Panneau vendeur et administration **en français d'office** (la langue reste modifiable dans Paramètres → Profil), menu vendeur simplifié, page **« Bien démarrer »** (arrivée après le passage en vendeur).
- [x] **Grossistes invisibles du public** : ni catalogue, ni accueil, ni carte, ni plan du site ; leurs fiches produit sont sans prix et hors Google.
- [x] **Devis retirés des fiches publiques** : réservés aux vendeurs connectés et aux comptes professionnels validés.
- [x] **Annuaire « Trouver un fournisseur »** (grossistes + marques) sur le site (`/gros`) et dans le panneau vendeur (« Fournisseurs »).
- [x] **Comptes professionnels** (hôtels, écoles…) : demande sur `/compte/pro`, décision par l'équipe sur `/dashboard/admin/pros` (accorder, refuser avec motif, retirer), e-mails automatiques.
- [ ] **Après le déploiement** : rien à configurer — le groupe « MACHE — Acheteurs professionnels » est créé au redémarrage du backend. Prévoir de traiter les demandes dans « Comptes professionnels » (menu admin).

## ⏸️ Proposé, en attente de votre feu vert

- [ ] **Grand livre + fiche mensuelle** par vendeur (sert dès aujourd'hui : ce que chaque vendeur doit en commission). Défauts retenus sauf avis contraire : mois calendaire, taux de change figé à la commande.
- [ ] **Supprimer le faux Stripe** (`src/lib/payments/index.ts`) — il répondrait « payé » sans rien encaisser. Plus aucune page ne l'appelle : c'est du code mort, sans danger aujourd'hui, mais un piège si quelqu'un le rebranche. *Attend votre oui.*
- [ ] **Retirer le catalogue de démonstration** — chaussures fictives en euros, 3 boutiques de démonstration, 20 rayons en anglais. Il remplit encore « Nouveautés ». À faire avant d'ouvrir à de vrais clients.
- [ ] **Protéger le panneau admin Medusa du backend** — jugé le chantier de sécurité le plus rentable restant.
- [ ] **Transmettre au backend l'adresse IP réelle des internautes** — le site appelle le backend depuis son propre serveur : pour le backend, tous les clients du site ont la même adresse. Conséquence : les plafonds ne peuvent pas distinguer deux clients passés par le site.

## 🔒 Bloqué par une décision de votre côté

- [ ] **Paiements : Pay'm (Haïti) + Stripe (le reste)** — décidé. **Bloqué par la LLC américaine** : Stripe exige une société dans un pays supporté.
- [ ] **Juriste** — ce qu'une LLC a le droit de faire en détenant l'argent des vendeurs. Plus un **compte bancaire séparé** pour cet argent.
- [ ] **Transporteur Haïti → étranger** — chemin critique : sans lui, un acheteur aux États-Unis paie et ne reçoit rien. *(Votre phrase sur « pas en lot, par quantités » : je ne l'ai pas comprise, à me réexpliquer.)*
- [ ] **Nom de domaine à MACHE** — pour les e-mails (une adresse @gmail.com envoyée par Brevo tombe plus souvent dans les indésirables) et pour le site.
- [ ] **Pièces d'identité des vendeurs** — 4 décisions : où les stocker, chiffrées ou non, qui peut les ouvrir, combien de temps.
- [ ] **Vrai domaine pour BAWON** — `bawon-plus-site.vercel.app` affiche « vercel.app » sur votre accueil.

## ❓ À trancher, petit

- [ ] Remettre un lien « S'inscrire » dans l'en-tête ? (réduit à une seule porte « Mon compte »)
- [ ] Si les journaux du backend signalent **des comptes « qui ne diffèrent que par les majuscules »** : deux comptes distincts pour la même personne, à départager à la main.
