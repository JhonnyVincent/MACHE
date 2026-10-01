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

## ⚠️ Points vigilants — à ressortir à chaque analyse

Ce sont les chantiers qui conditionnent l'ouverture réelle. Tant qu'ils ne sont pas faits, les remonter à chaque analyse.

- [ ] **Relier réellement les applications** (page « Applications » du panneau vendeur). Aujourd'hui seul l'intérêt des vendeurs est noté ; rien n'est relié. Ordre prévu : **Shopify et WooCommerce** (import des produits, sans autorisation de leur part), puis **Alibaba.com et AliExpress** (clés à demander par le fondateur sur leurs portails développeurs), puis CJ Dropshipping, Syncee, Spocket, Printful. Décider d'après « Applications demandées » (administration).
- [ ] **Brancher le paiement : Pay'm (Haïti) + Stripe (reste du monde).** Bloqué par la LLC (Stripe exige une société dans un pays supporté). Sans paiement réel, aucune vente n'est encaissée.
- [ ] **Ajouter MonCash et NatCash** (paiements mobiles en Haïti) en plus de Pay'm : le concurrent Bemane les affiche dès sa page d'accueil. À étudier avec Digicel (MonCash) et Natcom (NatCash).
- [ ] **Afficher les zones de livraison dès l'accueil** (comme Bemane : Pétion-Ville, Delmas, Tabarre, Carrefour…) et rendre le bouton « Vendre » plus visible.
- [ ] **Nom de domaine** : mache.fr est pris ; un autre site « machehaiti.com » existe (voir l'analyse). Vérifier la marque avant de choisir le domaine.
- [ ] **Brancher la livraison** : tarifs réels et transporteur (Haïti → étranger = chemin critique). Aujourd'hui les frais internationaux sont confirmés à la main.
- [ ] Avant toute publicité payante : nom de domaine propre, vrais produits (catalogue de démonstration retiré), pages légales complétées (nom de la LLC), paiement et livraison branchés.

## ✅ Fait : liste de départ des vendeurs et grossistes

- [x] Page publique `/rejoindre` : vendeur, grossiste ou marque laisse ses coordonnées ; la demande arrive dans la messagerie admin (catégorie « Ma boutique ») et l'équipe est prévenue par e-mail. Pas de réseaux sociaux pour l'instant.

## 💡 Idées tirées de l'analyse des concurrents (Bemane, Katalog) — à étudier

- [x] Bouton **« Commander sur WhatsApp »** sur les produits (le vendeur publie son numéro depuis « Profil de ma boutique »). Fait.
- [ ] **Lien de catalogue à partager** : faciliter l'envoi de la vitrine d'une boutique par WhatsApp.
- [ ] **Revendeurs affiliés** (revendre sans stock contre commission) — proche de l'idée vendeurs ↔ grossistes ↔ marques.
- [ ] **Services / agences** en plus des produits (Katalog les propose) : à décider.

## 🌍 International : conformité (à traiter avant les premiers colis réels)

- [ ] **Commencer par 3 corridors seulement** : Haïti → États-Unis, → Canada, → France. Ne pas « ouvrir le monde » avant de les maîtriser.
- [ ] **Liste des produits interdits ou encadrés à l'export** (alimentaire, cosmétiques, médicaments, plantes et produits animaux, alcool/rhum, contrefaçons) : à valider avec un transitaire et un juriste ; puis l'afficher dans les conditions vendeurs et bloquer ces catégories à l'international dans le catalogue.
- [ ] **Choisir un transitaire / groupeur** (expédition Haïti → étranger, dédouanement) : c'est lui qui connaît les règles par pays. Condition pour que « commande sur confirmation » devienne réelle.
- [ ] **Droits de douane et taxes à l'arrivée** : décider qui paie (l'acheteur à la réception, ou MACHE d'avance) et l'écrire clairement au paiement.
- [ ] **Pages légales** : conditions internationales, retours, protection des données (RGPD pour l'Europe), après identification de la LLC.
- [ ] **Colis pilote** : tester 5 à 10 envois réels (Haïti → USA/Canada/France) avant d'annoncer l'international au public.
- [ ] Idée Katalog : **filtre des boutiques par département d'Haïti** et compteurs en direct sur l'accueil.

## 🚚 Livraison à l'international — à faire APRÈS la déclaration de la société et le nom de domaine

Décision du fondateur : on s'en occupe une fois la LLC déclarée et le domaine acheté.

- [ ] Contacter 2 à 3 transitaires / transporteurs et comparer les devis sur le même colis type (2 kg, 10 kg, 50 kg vers États-Unis, Canada, France) : **Air Haiti Express**, **Amerijet**, **Haiti Cargo and Logistics**, **JECSLO**, et **DHL** pour les petits colis. Ce sont des pistes trouvées par recherche web, non contactées.
- [ ] Questions à poser : fait-il l'export depuis Haïti ? prix et minimum de poids ? délai ? produits refusés ? qui fait la douane et paie les droits ? suivi, assurance, interlocuteur ? travaille-t-il avec une marketplace (ramassage multi-vendeurs) ?
- [ ] Deux métiers à prévoir : express pour les petits colis, groupeur maritime pour les gros volumes (grossistes).
- [ ] Garder 2 ou 3 transporteurs en concurrence plutôt qu'un seul ; demander des références.
- [ ] Une fois choisi : brancher les tarifs réels dans MACHE, lancer les colis pilotes (5 à 10), puis ouvrir l'international.

## 💱 Devises

- [x] **Conversion indicative en direct** : le visiteur choisit « ≈ USD / EUR / CAD » dans l'en-tête ; l'équivalent s'affiche sous les prix (fiche produit, panier, paiement), au taux du jour (service public de taux, relu toutes les 6 h). Sans taux disponible, rien n'est affiché.
- [ ] 🔴 **URGENT — Prix en USD et paiement des vendeurs à l'international.** Un acheteur haïtien qui achète un produit venu de l'étranger : comment le vendeur est-il payé, dans quelle devise, par quel moyen ? À trancher avec le paiement (Pay'm / Stripe) et un juriste (MACHE ne doit pas détenir l'argent d'autrui sans cadre légal : passer par un prestataire de paiement agréé). Décision de principe (fondateur) : **pas de versements manuels**. Un seul compte MACHE chez un prestataire de paiement agréé qui encaisse, retient les fonds jusqu'à la livraison confirmée, puis verse automatiquement à chaque vendeur (le vendeur renseigne ses coordonnées de versement une seule fois, chez le prestataire, jamais chez MACHE). Deux devises (HTG et USD), un panier par devise ; échanges avec les fournisseurs étrangers en USD. **Vendeur qui fixe ses prix en dollars (USD)** : très utilisé en Haïti. Aujourd'hui la facturation est en gourdes (HTG) ; facturer en USD demande une région et des prix USD, et un panier ne mélange pas deux devises. À décider avec le paiement (Pay'm = HTG, Stripe = USD).

## 🧭 Décisions du fondateur (octobre 2026)

- **Frais de livraison** : ni MACHE ni BAWON ne les prennent en charge. Ils sont payés par l'acheteur (affichés avant paiement) ou inclus par le vendeur dans son prix.
- **BAWON** n'est pas un prestataire de livraison : il accompagne les marchands vers un financement (déjà écrit ainsi sur la page Partenaires).
- **Partenaires de MACHE** = toutes les entreprises qui proposent des **services en plus** sur la place de marché (photographe, financement, etc.).
- [ ] **Espace Services / Partenaires** : permettre à ces entreprises de se présenter et d'être contactées (idée proche de « Agences & Business » chez Katalog). À concevoir : inscription, fiche, catégories de services, contact. Aucun service ne doit être présenté comme garanti par MACHE.

## 🏦 Paiements : ordre des prérequis (bloqué par le juridique)

Principe : MACHE ne stocke aucune donnée bancaire et ne détient pas l'argent ; tout passe par un prestataire agréé. Le branchement technique est faisable ; ce qui bloque est juridique.

1. [ ] **Déclarer la LLC** (nom légal, État, numéro, adresse) et ouvrir **un compte bancaire professionnel** au nom de la société.
2. [ ] **Consulter un juriste** : cadre pour qu'une marketplace encaisse pour des vendeurs (haïtiens et étrangers) sans détenir elle-même les fonds ; obligations liées à l'identité des clients et vendeurs ; conditions d'envoi d'argent vers Haïti.
3. [ ] **Demander aux prestataires** (questions identiques à chacun) : MonCash Business (Digicel), Pay'm, Stripe, et un service de transfert vers Haïti : peuvent-ils (a) encaisser pour une marketplace, (b) verser des vendeurs haïtiens, (c) quelles pièces et quels frais, (d) quels délais de versement ?
4. [ ] **Choisir le circuit** : hors Haïti (Stripe, cartes) + en Haïti (MonCash/Pay'm), et comment l'argent encaissé à l'étranger rejoint les vendeurs en Haïti. (Stripe ne supporte pas Haïti : à revérifier sur sa liste officielle.)
5. [ ] **Branchement technique** (par Claude) : prestataire de versement de Mercur (interface prévue pour d'autres prestataires que Stripe) + tâches planifiées de capture et de versement + deux devises (HTG, USD).
6. [ ] **Tests avec de petites vraies sommes**, puis ouverture.

## ✅ Fait (octobre 2026) : partenaires, panneau vendeur

- [x] **Partenaires de services** : inscription publique (`/partenaires/inscription`), examen et gestion par l'équipe (`/dashboard/admin/partenaires` : ajouter, corriger, approuver, suspendre, exclure, supprimer), profils publics. Rien n'est public avant approbation.
- [x] **Panneau vendeur contrôlé de bout en bout** : états vides et libellés restés en anglais traduits (fichier `backend/apps/vendor/src/i18n/fr.json`, à compléter si une autre phrase apparaît).
- [x] **Droits de l'équipe** : le panneau propose déjà 5 rôles à l'invitation d'un membre (Administration, Gestion des stocks, Gestion des commandes, Comptabilité, Support). **À vérifier avec un second compte** que « Gestion des commandes » peut expédier sans pouvoir rembourser (non testé).
- [ ] **Boutiques côté administration** : suspendre et résilier (= bannir) existent déjà. **Ajouter une boutique à la main** et **supprimer** ne sont pas faits : une boutique a besoin d'un compte propriétaire (e-mail + mot de passe) et supprimer effacerait ses commandes et ses commissions. Proposition : bouton « inviter un vendeur » (lien d'inscription envoyé par e-mail) et « résilier » à la place de supprimer.
- [ ] **Alternative à Tally pour une page d'atterrissage sponsorisable** : Brevo (déjà utilisé pour les e-mails) propose des pages d'atterrissage et des formulaires ; Carrd ou Systeme.io permettent d'installer le pixel publicitaire (Meta/Google). À décider.

## ✅ Fait : équipe déléguée et invitation de vendeurs

- [x] **Propriétaire + membres délégués** (`/dashboard/admin/equipe`, réservé au propriétaire) : deux espaces — **Suivi des clients** (messages, comptes pro, avis, clients bloqués) et **Site et mises à jour** (apparence, textes, promotions, partenaires). Le membre reçoit un e-mail pour choisir son mot de passe. La règle est appliquée **côté serveur** sur chaque route d'administration (testée : un délégué reçoit « refusé » sur les revenus, l'équipe, la suspension d'une boutique…).
- [x] **Inviter un vendeur** (page Boutiques) : e-mail avec le lien d'inscription ; le vendeur crée lui-même son compte, la boutique reste soumise à approbation.
- [ ] Un compte administrateur **sans rôle noté est propriétaire** : ne créer les membres délégués que par la page Équipe. Pour un second propriétaire, créer le compte dans le panneau du backend.
- [ ] Un troisième espace (ex. logistique, comptabilité) : à ajouter dans `backend/packages/api/src/lib/staff.ts` et `src/lib/staff.ts` (même liste, un test le vérifie).

## 🏷️ Noms des espaces (décidés le 1er octobre 2026)

- **MACHE Pilote** : la gestion de la marketplace (le propriétaire et son équipe déléguée). Nom **affiché** (titres, connexion, e-mails de l'équipe).
- **MACHE Boutik** : l'espace des vendeurs, grossistes et marques. Nom **interne** pour distinguer dans le code et entre nous : **jamais affiché**. Les vendeurs voient « Espace vendeur ». Chacun invite son équipe dans Paramètres → Utilisateurs, avec cinq rôles (administration, stocks, commandes, comptabilité, support).
- Voir `src/lib/spaces.ts`.

## ✅ Fait : la marque autorise ses revendeurs

- [x] Page **Revendeurs** dans le panneau vendeur (réservée aux boutiques déclarées « marque ») : autoriser une boutique sur un ou plusieurs produits, retirer l'autorisation. Règles appliquées côté serveur : seule la marque du produit peut autoriser, la marque ne peut pas se retirer, le revendeur doit être une boutique ouverte.
- Fonctionnement (Mercur) : un produit qui a au moins une boutique autorisée est **réservé** à celles-ci ; une boutique non autorisée ne peut pas le proposer. Un produit sans aucune autorisation reste **ouvert à tous** : la marque ne peut alors pas le réclamer.
- [x] **Vérifié** (comptes d'essai) : un revendeur non autorisé ne voit pas un produit réservé à une marque ; une fois autorisé, il le voit dans son panneau.
- [x] **Demande d'autorisation par le revendeur** : page Revendeurs → « Produits de marque à revendre » → « Demander l'autorisation ». La marque est prévenue par e-mail, accepte ou refuse dans « Demandes reçues », et le revendeur est prévenu de la décision.
- [ ] Reste à vérifier en conditions réelles : que le revendeur peut créer son offre sur le produit autorisé depuis le panneau (la visibilité est vérifiée, pas la création de l'offre elle-même).

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
