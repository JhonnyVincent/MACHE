# MACHE — liste des corrections à faire

Relevé du 30 septembre 2026, mis à jour le même jour après une première série de corrections, fait en testant le site comme chaque profil (vendeur, acheteur, diaspora, grossiste, agent, admin) et en contrôlant 20 points techniques.
**Rien n'est encore corrigé** : c'est la liste de travail. On coche au fur et à mesure.

Légende : ✅ bon · ⚠️ à améliorer · ❌ manque ou cassé

---

## Partie 1 — Les 20 points de contrôle

| # | Point | État | Ce qui a été constaté | Ce qu'il faut faire |
|---|---|---|---|---|
| 1 | Page RGPD (confidentialité) | ⚠️ | `/legal/privacy` : claire et exacte. **Ajouté le 30/09** : Brevo (e-mails), hébergeur Render (base à Francfort), cookie du panneau vendeur, statistiques quand actives. **Manquent** : qui est responsable (nom légal de la LLC, adresse), durées de conservation (recommandations ci-dessous), liste complète des droits (accès, effacement, portabilité, opposition, réclamation). | Identité de la LLC + validation des durées par le juriste, puis je complète. |
| 2 | CGU (conditions générales) | ⚠️ | `/legal/terms`, `/legal/vendors`, `/legal/returns`, `/legal/shipping` existent. **Pas de mentions légales** : aucune page ne dit qui exploite le site (nom, adresse, contact, hébergeur). | Ajouter une page « Mentions légales » + l'identité dans les CGU. **Dépend de la LLC.** Faire relire par le juriste. |
| 3 | API et secrets hors du navigateur | ✅ | Seules 3 valeurs publiques par nature sont envoyées au navigateur (adresse du backend, clé publique Medusa, région). Aucun secret (JWT, cookies, Brevo, base de données, mot de passe admin) trouvé dans le code envoyé aux visiteurs. Les appels sensibles passent par le serveur. | Rien. Garder la règle : secrets uniquement dans Render. |
| 4 | Bannière cookies | ✅ (pas obligatoire aujourd'hui) | Le site ne dépose que des cookies **nécessaires** (panier, connexion, langue) : aucun traceur ni publicité. Dans ce cas, la loi n'exige pas de bannière. | Si on ajoute un outil de statistiques **avec** cookies, il faudra une bannière. Préférer un outil **sans cookies** (point 17) pour ne pas en avoir besoin. |
| 5 | Meta title (titre des pages) | ✅ Fait | Chaque page a son titre et sa description. Fiche produit : « Nom — prix HTG | MACHE ». Rayons : « Mode — acheter en ligne en Haïti ». Recherches et pages privées hors de Google. | — |
| 6 | Favicon (icône d'onglet) | ✅ Fait | Icône tirée du logo : onglet, écran d'accueil du téléphone (Android et iPhone). | — |
| 7 | Sitemap + robots.txt | ✅ Fait | `/sitemap.xml` liste les pages, rayons, boutiques et produits (mis à jour toutes les heures). `/robots.txt` ferme les espaces connectés, le panier, la commande. | Le déclarer dans Google Search Console une fois le domaine choisi. |
| 8 | Textes des images (alt) | ✅ | 135 images contrôlées : **toutes** ont un texte alternatif. | Rien. Vérifier que les photos ajoutées par les vendeurs en ont aussi. |
| 9 | Compression des images | ✅ Fait | Logo : 1,2 Mo → 14 Ko (et il n'est plus déformé). Carte : 1,2 Mo → 65 Ko. Photos des rayons : 1,46 Mo → 0,5 Mo. Images hors écran chargées seulement quand on descend. | Les photos des vendeurs : à compresser à l'envoi (chantier suivant). |
| 10 | Vitesse des pages | ⚠️ | Le code est rapide (0,1 à 0,8 s par page en local). Deux freins : les images trop lourdes (point 9), et **Render gratuit qui s'endort** : la première visite attend environ 1 minute. La page « À propos » pèse 1,2 Mo. | Point 9, puis passer site + backend à l'offre payante Render. |
| 11 | Contrastes | ✅ Fait | Pied de page, menus des espaces, rouge de la marque (#e41d39 → #d41834, identique à l'œil), étiquette dorée. Contrôle automatique : 0 texte trop pâle une fois les animations terminées. | — |
| 12 | Site responsive (téléphone) | ✅ | 30 pages testées en largeur téléphone (360 px) : aucune ne déborde. | Rien. |
| 13 | Page 404 personnalisée | ✅ Fait | Page en français avec recherche et liens utiles. | — |
| 14 | Liens cassés | ✅ | 400 pages parcourues automatiquement : **aucun lien interne cassé**. 18 liens externes : images de la démonstration + BAWON (`bawon-plus-site.vercel.app`). | Rien côté site. Donner un vrai domaine à BAWON. |
| 15 | Validation des formulaires | ✅ | Champs obligatoires et longueurs contrôlés dans le navigateur **et** vérifiés à nouveau par le serveur (contact, inscription, boutique, commande, devis). | Rien d'urgent. Page de commande : voir Acheteur, point 4. |
| 16 | Anti-spam | ✅ Fait | Sur les 5 formulaires publics (inscription, boutique, contact, devis, nouvelles) : champ piège invisible, délai minimum de 2,5 s, plafond par adresse IP et par heure (large, car en Haïti beaucoup d'abonnés partagent la même adresse). Sans captcha. | — |
| 17 | Outil de statistiques (analytics) | ✅ Prêt | Cloudflare Web Analytics : gratuit, sans cookie, donc sans bannière. S'active dès que le jeton est posé (voir A-FAIRE, étape 10). La page Confidentialité le mentionne automatiquement une fois actif. | **Toi** : créer le jeton (5 min). |
| 18 | Aperçu des liens partagés (WhatsApp, Facebook) | ✅ Fait | Produit : photo + nom + prix. Boutique : bannière + nom. Autres pages : image MACHE (logo + « La marketplace haïtienne »). | — |
| 19 | E-mails automatiques | ✅ Fait | Vendeur : nouvelle commande (articles, client, téléphone, adresse), nouveau devis, boutique approuvée. Acheteur : confirmation (un seul e-mail même pour plusieurs boutiques), réponse au devis. Demandeur : réponse de MACHE (le lien, pas le texte). Équipe : nouvelle boutique, nouveau message. Testés de bout en bout. | **Toi** : `BREVO_API_KEY` doit être posée, sinon rien ne part. |
| 20 | Sécurité et sauvegardes | ⚠️ | Bon : 6 en-têtes de sécurité, HTTPS forcé, connexions limitées, secrets protégés. **À faire** : la base gratuite Render est **effacée au bout de 30 jours** et n'a pas de sauvegarde ; le panneau d'administration Medusa n'est pas protégé en plus ; aucune alerte en cas de panne. | Passer la base en payant (sauvegardes incluses), protéger le panneau admin Medusa. |

**Bilan des 20 points (mis à jour le 30 septembre, après corrections) : 16 ✅ · 4 ⚠️ (RGPD, CGU, vitesse, sauvegardes) · 0 ❌**

La page Confidentialité mentionne désormais Brevo (e-mails), l'hébergement Render (base à Francfort), le cookie du panneau vendeur, et les statistiques quand elles sont actives.

---

## Tes décisions (30 septembre) et mes recommandations

- **Statistiques** : Render n'en fournit pas (ses graphiques mesurent le serveur, pas les visiteurs). Retenu : **Cloudflare Web Analytics**, gratuit et sans cookie. Code en place, il manque le jeton.
- **Durées de conservation**, ce que je recommande (usages courants, à faire valider par le juriste) :
  - compte client : tant qu'il sert, puis supprimé ou anonymisé **3 ans** après la dernière connexion ou commande ;
  - commandes et factures : la durée exigée par la comptabilité (souvent **7 à 10 ans** selon le pays) ;
  - messages au service client : **3 ans** après le dernier échange ;
  - devis sans suite : **1 an** ;
  - abonnés aux nouvelles : jusqu'au désabonnement ;
  - pièces d'identité des vendeurs : durée de la relation + **5 ans** (lutte contre la fraude) ;
  - journaux techniques : **12 mois**.
  Elles ne seront écrites sur la page Confidentialité qu'une fois validées **et** appliquées par une suppression automatique : annoncer une durée qu'aucun programme ne respecte serait une fausse promesse.
- **Société** (précisé le 30/09) : une LLC nommée « Mache », immatriculée aux États-Unis, dont une partie est détenue par BAWON, créée pour relier le marché haïtien au reste du monde (partenariats, échanges). Adresse exacte : à venir. La gestion du site pourrait être confiée à une société tierce, voire la part cédée : **pas encore décidé**. Pour la page **Mentions légales**, il manque donc : nom légal exact (ex. « Mache LLC »), État et numéro d'immatriculation, adresse, et qui exploite le site (la LLC ou la société de gestion). La participation de BAWON n'a pas à y figurer.
- **Sens du nom** : à choisir parmi les propositions de Claude (voir la conversation du 30/09) — rien n'est affiché sur le site avant ton choix.
- **Livraison** : pas encore de tarifs (DHL envisagé, d'autres à comparer). **Décidé le 30/09 : on ne ferme pas l'étranger** — l'objectif est de relier Haïti au monde. ✅ Fait : la « commande sur confirmation » (voir Diaspora ci-dessous).
- **Points relais et agents** : rémunérés en fonction des colis livrés, montants à étudier. C'est ce que disent maintenant l'accueil et la page Partenaires, sans chiffre.
- **Prix selon le pays du visiteur + traduction complète** : voir le chantier ci-dessous.

## Chantier à venir : langues et devises

- **Pourquoi des textes ne sont pas traduits** : seule la bande du haut et le menu ont une traduction (créole). Tout le reste du site est écrit directement en français dans les pages : le sélecteur de langue ne peut rien traduire d'autre.
- **Traduction à 100 %** : sortir chaque texte des pages vers des fichiers de traduction (français, créole, anglais), puis les traduire. C'est le plus gros chantier restant (75 pages). À faire page par page, en commençant par le parcours d'achat.
- **Devise selon le pays** : afficher un **prix indicatif** en dollars, euros ou dollars canadiens selon le pays du visiteur (détecté par sa connexion, modifiable à la main), converti au taux du jour. Le paiement reste en gourdes tant qu'il n'y a pas de paiement en ligne. Des prix réels dans plusieurs devises demandent un paiement en ligne (Stripe, donc la LLC).

## Partie 2 — Corrections par profil

### 🛍️ Vendeur

- [ ] **Panneau vendeur en français par défaut.** Il s'ouvre en anglais (Orders, Products…). La traduction française existe, mais il faut aller la chercher dans *Settings → Profile → Language*.
- [ ] **Simplifier l'ajout d'un produit.** Aujourd'hui : 4 étapes en anglais (Details, Organize, Attributes, Variants), avec des exemples comme « Winter jacket ». C'est le geste le plus important, et le plus dur.
- [x] **E-mail au vendeur** à chaque nouvelle commande et à chaque nouveau devis.
- [ ] **Message contradictoire après l'inscription** : « Votre boutique est ouverte » (vert) juste au-dessus de « en attente d'approbation » (jaune). Garder un seul message clair.
- [ ] **Vitrine** : le code technique « pending_approval » s'affiche. Écrire « en attente d'approbation ».
- [ ] **Liste des premières étapes** dans l'espace vendeur : adresse, moyen de paiement, premier produit, vitrine. Dans le panneau, ces rubriques sont vides et en anglais.
- [ ] **Résumé des ventes dans l'espace vendeur du site** : commandes, devis et chiffre du mois. Aujourd'hui tout est dans le panneau.
- [x] **E-mail « boutique approuvée »** quand l'admin valide.

### 🛒 Acheteur (Haïti)

- [ ] **Rayons vides** : « Maison » depuis l'accueil affiche « 0 produit ». Les seuls produits sont ceux de la démonstration, dans des rayons en anglais (Sandals, Sneakers…). Se règle en retirant la démonstration (**attend ton accord**) et avec de vrais vendeurs.
- [ ] **Fiche produit : boutiques en double** (Kickz Corner ×2, Trailhead ×2, Sole Society ×2). N'afficher chaque boutique qu'une fois.
- [ ] **Fiche produit** : le bouton « Aide rapide » cache le dernier « Demander un devis ».
- [ ] **Un avis affiche « (avis product) »** : texte technique à retirer.
- [x] **Page de commande :**
  - [x] e-mail, prénom, nom et téléphone du client connecté préremplis ;
  - [x] l'adresse reste affichée une fois validée ;
  - [x] les modes de la démonstration s'appellent « Livraison standard / express en Haïti » — [ ] **les vrais tarifs restent à fixer** (350 HTG = démonstration).
- [x] **Confirmation** : le numéro de commande (« n° 7 ») remplace la référence technique pour un client connecté ; un invité voit encore la référence (Mercur ne donne les numéros qu'aux clients connectés).
- [ ] **Détail de commande** : « Paiement : Autorisé » pour un paiement à la livraison. Écrire « À régler à la livraison ».
- [x] **E-mail de confirmation de commande.**

### ✈️ Acheteur de la diaspora

- [x] **Commander depuis l'étranger fonctionne** (30/09) — « commande sur confirmation » : 21 pays de la diaspora (États-Unis, Canada, France, Antilles, République dominicaine…) ; mode « Expédition internationale — frais confirmés avant envoi », affiché « À confirmer » ; paiement « Rien à payer maintenant » ; e-mail à l'acheteur (frais à confirmer), au vendeur (« N'EXPÉDIEZ RIEN avant la confirmation »), et alerte à l'équipe pour chiffrer l'envoi. Testé de bout en bout depuis Paris.
  - [ ] **À faire par l'équipe à chaque commande internationale** : calculer l'expédition, l'envoyer au client avec le moyen de paiement, puis donner le feu vert au vendeur.
  - [ ] **Plus tard** : tarifs automatiques (DHL ou autre) et paiement en ligne, pour que la confirmation manuelle disparaisse.
- [x] **Préciser qu'on peut commander pour sa famille en Haïti** : dit sur la page de commande, la FAQ et la page Livraison.
- [ ] **Prix selon le pays du visiteur** (décidé : détection de la connexion, prix indicatif en dollars / euros, paiement en gourdes) — voir « Chantier à venir : langues et devises ».

### 📦 Grossiste / acheteur en volume

- [x] **Personne n'est prévenu quand le vendeur répond au devis.** Le client doit garder le lien et revenir voir : envoyer un e-mail.
- [ ] **Page « Demande de devis » seule** : elle renvoie vers le catalogue. Proposer une demande libre (« je cherche 200 sacs de riz »).
- [ ] **« Trouver un fournisseur » mène à /gros**, sans liste de fournisseurs. Ajouter un filtre « Grossiste » ou un annuaire des fournisseurs.

### 🚚 Agent / point relais

- [ ] **Pas de formulaire de candidature** : passer par un formulaire « Devenir point relais / agent » au lieu du contact général.
- [x] **Rémunération** : « en fonction des colis livrés », sans montant.
- [ ] **Les commandes ne sont pas reliées aux points relais** : l'espace agent reste vide tant qu'on ne peut pas choisir un point de retrait à la commande.

### 🔧 Administrateur

- [ ] **Faire le ménage** : 15 boutiques de test en attente, dont les 3 boutiques de démonstration.
- [x] **« Vos réponses ne préviennent personne — MACHE n'a pas de service d'e-mail »** : maintenant que Brevo est en place, envoyer tes réponses par e-mail et mettre ce texte à jour. Même texte à corriger sur la page de confirmation du formulaire de contact.
- [x] **Alertes** : e-mail à l'équipe pour une nouvelle boutique à approuver et un nouveau message (les commandes vont au vendeur concerné).

---

## Partie 3 — Ce qui fonctionne (testé en cliquant)

- **Vendeur** :
  - inscription en 1 minute ;
  - entrée dans le panneau sans ressaisir le mot de passe ;
  - éditeur de vitrine en français ;
  - approbation par l'admin.
- **Acheteur** :
  - recherche, panier en HTG ;
  - commande complète avec paiement à la livraison ;
  - espace client, favoris ;
  - formulaire de contact.
- **Grossiste** : demande de devis depuis une fiche produit, avec un numéro de suivi.
- **Agent** : nomination par l'admin, code de carte, espace agent, vérification publique du code (un faux code est bien refusé).
- **Admin** :
  - vue d'ensemble, approbation des boutiques, agents ;
  - revenus et commissions dues, messages ;
  - promotions, gel des versements.
- **Technique** :
  - 312 tests automatiques réussis ;
  - aucun lien cassé ;
  - toutes les images ont un texte alternatif ;
  - affichage correct sur téléphone ;
  - secrets protégés, en-têtes de sécurité en place.

---

## Partie 4 — Ordre d'exécution proposé

1. **Rapide et visible** : favicon, page 404, titres des pages, aperçu WhatsApp, sitemap + robots.txt, contraste du pied de page, compression du logo et de la carte.
2. **Vendeur** : panneau en français, messages clairs après inscription, « pending_approval ».
3. **Page de commande et petits défauts** : e-mail prérempli, adresse gardée, livraison en français, pays étrangers, boutiques en double, « (avis product) », référence, « Paiement autorisé ».
4. **E-mails** : commandes, devis, réponses, boutique approuvée, alertes admin.
5. **Anti-spam** (champ piège + vraie adresse IP) et **statistiques** (après ton choix d'outil).
6. **Pages légales** : RGPD complétée et mentions légales, dès que la LLC et les durées de conservation sont décidées.
7. **Avec ton accord** : retirer la démonstration, ménage des boutiques de test.

**Décisions qui t'attendent** (mises à jour le 30/09) : jeton Cloudflare pour les statistiques · validation des durées de conservation · identité exacte de la LLC et de qui exploite le site · sens du nom MACHE · retrait de la démonstration · tarifs de transporteur (DHL ou autre) · montants de rémunération des points relais et agents.

**Déjà tranché** : statistiques = Cloudflare Web Analytics · étranger = commande sur confirmation · points relais et agents payés selon les colis livrés · prix affiché selon le pays du visiteur.
