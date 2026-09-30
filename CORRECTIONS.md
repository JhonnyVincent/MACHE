# MACHE — liste des corrections à faire

Relevé du 30 septembre 2026, fait en testant le site comme chaque profil (vendeur, acheteur, diaspora, grossiste, agent, admin) et en contrôlant 20 points techniques.
**Rien n'est encore corrigé** : c'est la liste de travail. On coche au fur et à mesure.

Légende : ✅ bon · ⚠️ à améliorer · ❌ manque ou cassé

---

## Partie 1 — Les 20 points de contrôle

| # | Point | État | Ce qui a été constaté | Ce qu'il faut faire |
|---|---|---|---|---|
| 1 | Page RGPD (confidentialité) | ⚠️ | `/legal/privacy` existe, honnête et claire (données demandées, qui voit quoi, cookies, droits). **Manquent** : qui est responsable (nom de la société, adresse), l'hébergeur (Render, Francfort), **Brevo** qui reçoit les adresses e-mail (newsletter, mot de passe oublié), les durées de conservation, la liste complète des droits (accès, effacement, portabilité, opposition, réclamation), et le cookie de session du panneau vendeur (`connect.sid`). | Compléter la page. Les durées et l'identité de la société dépendent de **ta décision / de la LLC**. |
| 2 | CGU (conditions générales) | ⚠️ | `/legal/terms`, `/legal/vendors`, `/legal/returns`, `/legal/shipping` existent. **Pas de mentions légales** : aucune page ne dit qui exploite le site (nom, adresse, contact, hébergeur). | Ajouter une page « Mentions légales » + l'identité dans les CGU. **Dépend de la LLC.** Faire relire par le juriste. |
| 3 | API et secrets hors du navigateur | ✅ | Seules 3 valeurs publiques par nature sont envoyées au navigateur (adresse du backend, clé publique Medusa, région). Aucun secret (JWT, cookies, Brevo, base de données, mot de passe admin) trouvé dans le code envoyé aux visiteurs. Les appels sensibles passent par le serveur. | Rien. Garder la règle : secrets uniquement dans Render. |
| 4 | Bannière cookies | ✅ (pas obligatoire aujourd'hui) | Le site ne dépose que des cookies **nécessaires** (panier, connexion, langue) : aucun traceur ni publicité. Dans ce cas, la loi n'exige pas de bannière. | Si on ajoute un outil de statistiques **avec** cookies, il faudra une bannière. Préférer un outil **sans cookies** (point 17) pour ne pas en avoir besoin. |
| 5 | Meta title (titre des pages) | ❌ | **14 pages sur 30** s'appellent seulement « MACHE » : accueil, catalogue, fiche produit, boutique, panier, vendre, connexion, inscription… Toutes les fiches produit et boutiques ont le même titre. | Un titre et une description propres à chaque page (nom du produit + prix, nom de la boutique, etc.). |
| 6 | Favicon (icône d'onglet) | ❌ | Aucune icône : l'onglet et l'écran d'accueil du téléphone affichent une icône vide. | Créer l'icône à partir du logo hibiscus (onglet + téléphone). |
| 7 | Sitemap + robots.txt | ❌ | `/sitemap.xml` et `/robots.txt` → page introuvable. Google n'a pas de plan du site, et rien ne lui interdit les pages de compte. | Générer le sitemap (pages, produits, boutiques) et un robots.txt qui exclut `/dashboard`, `/cart`, `/checkout`, `/compte`. |
| 8 | Textes des images (alt) | ✅ | 135 images contrôlées : **toutes** ont un texte alternatif. | Rien. Vérifier que les photos ajoutées par les vendeurs en ont aussi. |
| 9 | Compression des images | ❌ | **Le logo pèse 1,2 Mo et se charge sur chaque page** (1536 px affiché en 80 px). La carte d'Haïti pèse aussi 1,2 Mo. 49 images sont bien plus grandes que leur affichage (photos des rayons de 900 px pour 200 px). | Réduire le logo et la carte (quelques dizaines de Ko), servir les images au bon format et à la bonne taille. Gros gain en Haïti où la connexion est lente. |
| 10 | Vitesse des pages | ⚠️ | Le code est rapide (0,1 à 0,8 s par page en local). Deux freins : les images trop lourdes (point 9), et **Render gratuit qui s'endort** : la première visite attend environ 1 minute. La page « À propos » pèse 1,2 Mo. | Point 9, puis passer site + backend à l'offre payante Render. |
| 11 | Contrastes | ❌ | **850 textes** trop pâles sur les 30 pages. Le principal : le texte gris du **pied de page** sur fond noir (174 fois sur 6 pages, présent partout), le « © 2026 » encore plus pâle, le rouge sur fond beige légèrement insuffisant. | Éclaircir le gris du pied de page et foncer légèrement le rouge sur fond clair. Correction simple, effet sur tout le site. |
| 12 | Site responsive (téléphone) | ✅ | 30 pages testées en largeur téléphone (360 px) : aucune ne déborde. | Rien. |
| 13 | Page 404 personnalisée | ❌ | Une adresse inexistante affiche la page anglaise de Next.js « This page could not be found ». | Page 404 MACHE en français, avec recherche et liens utiles. |
| 14 | Liens cassés | ✅ | 400 pages parcourues automatiquement : **aucun lien interne cassé**. 18 liens externes : images de la démonstration + BAWON (`bawon-plus-site.vercel.app`). | Rien côté site. Donner un vrai domaine à BAWON. |
| 15 | Validation des formulaires | ✅ | Champs obligatoires et longueurs contrôlés dans le navigateur **et** vérifiés à nouveau par le serveur (contact, inscription, boutique, commande, devis). | Rien d'urgent. Page de commande : voir Acheteur, point 4. |
| 16 | Anti-spam | ⚠️ | Des plafonds existent : messages de contact et newsletter limités par adresse et par heure, devis limités (10/h par adresse, 60/h par boutique), connexions limitées. **Pas de piège à robots ni de captcha**, et les plafonds se contournent en changeant d'adresse e-mail. L'inscription client n'a pas de plafond. | Ajouter un champ piège invisible (sans gêner les vrais visiteurs) + un plafond par adresse IP (nécessite de transmettre la vraie IP au backend, déjà listé dans A-FAIRE). |
| 17 | Outil de statistiques (analytics) | ❌ | Aucun outil : impossible de savoir combien de visiteurs, d'où, et quelles pages. | Choisir un outil **sans cookies**, pour ne pas avoir besoin de bannière (ex. Cloudflare Web Analytics ou Umami). **Ta décision** : lequel. |
| 18 | Aperçu des liens partagés (WhatsApp, Facebook) | ❌ | Aucune page n'a d'aperçu : un produit partagé sur WhatsApp n'affiche ni photo, ni prix, ni nom. | Aperçu (photo + titre + prix) sur chaque produit et boutique, image par défaut ailleurs. |
| 19 | E-mails automatiques | ❌ | Seul « mot de passe oublié » envoie un e-mail. Rien pour : nouvelle commande (acheteur **et** vendeur), nouveau devis, réponse d'un vendeur, réponse de l'admin, boutique approuvée. | Brancher ces e-mails sur Brevo (déjà en place). |
| 20 | Sécurité et sauvegardes | ⚠️ | Bon : 6 en-têtes de sécurité, HTTPS forcé, connexions limitées, secrets protégés. **À faire** : la base gratuite Render est **effacée au bout de 30 jours** et n'a pas de sauvegarde ; le panneau d'administration Medusa n'est pas protégé en plus ; aucune alerte en cas de panne. | Passer la base en payant (sauvegardes incluses), protéger le panneau admin Medusa. |

**Bilan des 20 points : 7 ✅ · 5 ⚠️ · 8 ❌**

---

## Partie 2 — Corrections par profil

### 🛍️ Vendeur

- [ ] **Panneau vendeur en français par défaut.** Il s'ouvre en anglais (Orders, Products…). La traduction française existe, mais il faut aller la chercher dans *Settings → Profile → Language*.
- [ ] **Simplifier l'ajout d'un produit.** Aujourd'hui : 4 étapes en anglais (Details, Organize, Attributes, Variants), avec des exemples comme « Winter jacket ». C'est le geste le plus important, et le plus dur.
- [ ] **E-mail au vendeur** à chaque nouvelle commande et à chaque nouveau devis.
- [ ] **Message contradictoire après l'inscription** : « Votre boutique est ouverte » (vert) juste au-dessus de « en attente d'approbation » (jaune). Garder un seul message clair.
- [ ] **Vitrine** : le code technique « pending_approval » s'affiche. Écrire « en attente d'approbation ».
- [ ] **Liste des premières étapes** dans l'espace vendeur : adresse, moyen de paiement, premier produit, vitrine. Dans le panneau, ces rubriques sont vides et en anglais.
- [ ] **Résumé des ventes dans l'espace vendeur du site** : commandes, devis et chiffre du mois. Aujourd'hui tout est dans le panneau.
- [ ] **E-mail « boutique approuvée »** quand l'admin valide.

### 🛒 Acheteur (Haïti)

- [ ] **Rayons vides** : « Maison » depuis l'accueil affiche « 0 produit ». Les seuls produits sont ceux de la démonstration, dans des rayons en anglais (Sandals, Sneakers…). Se règle en retirant la démonstration (**attend ton accord**) et avec de vrais vendeurs.
- [ ] **Fiche produit : boutiques en double** (Kickz Corner ×2, Trailhead ×2, Sole Society ×2). N'afficher chaque boutique qu'une fois.
- [ ] **Fiche produit** : le bouton « Aide rapide » cache le dernier « Demander un devis ».
- [ ] **Un avis affiche « (avis product) »** : texte technique à retirer.
- [ ] **Page de commande :**
  - [ ] l'e-mail du client connecté n'est pas prérempli ;
  - [ ] l'adresse se vide à l'écran une fois validée (elle est pourtant enregistrée) : la réafficher ;
  - [ ] les modes de livraison s'appellent « Standard Shipping » et « Express Shipping », en anglais, au même prix de démonstration (350 HTG) : les renommer et fixer de vrais tarifs.
- [ ] **Confirmation** : la référence technique « og_01M3SB… » s'affiche au lieu du numéro de commande « #4 ».
- [ ] **Détail de commande** : « Paiement : Autorisé » pour un paiement à la livraison. Écrire « À régler à la livraison ».
- [ ] **E-mail de confirmation de commande.**

### ✈️ Acheteur de la diaspora

- [ ] **France, États-Unis et Canada sont proposés, mais la commande échoue** avec un message technique en anglais (« Country with code fr is not within region Haïti »). Retirer ces pays tant qu'il n'y a pas de transporteur, ou afficher un message clair en français.
- [ ] **Préciser qu'on peut commander pour sa famille en Haïti** (ça fonctionne déjà).
- [ ] **Prix affichés en HTG seulement** : ajouter un équivalent indicatif en dollars ou en euros (à décider).

### 📦 Grossiste / acheteur en volume

- [ ] **Personne n'est prévenu quand le vendeur répond au devis.** Le client doit garder le lien et revenir voir : envoyer un e-mail.
- [ ] **Page « Demande de devis » seule** : elle renvoie vers le catalogue. Proposer une demande libre (« je cherche 200 sacs de riz »).
- [ ] **« Trouver un fournisseur » mène à /gros**, sans liste de fournisseurs. Ajouter un filtre « Grossiste » ou un annuaire des fournisseurs.

### 🚚 Agent / point relais

- [ ] **Pas de formulaire de candidature** : passer par un formulaire « Devenir point relais / agent » au lieu du contact général.
- [ ] **Rémunération** non affichée : **attend ta décision**.
- [ ] **Les commandes ne sont pas reliées aux points relais** : l'espace agent reste vide tant qu'on ne peut pas choisir un point de retrait à la commande.

### 🔧 Administrateur

- [ ] **Faire le ménage** : 15 boutiques de test en attente, dont les 3 boutiques de démonstration.
- [ ] **« Vos réponses ne préviennent personne — MACHE n'a pas de service d'e-mail »** : maintenant que Brevo est en place, envoyer tes réponses par e-mail et mettre ce texte à jour. Même texte à corriger sur la page de confirmation du formulaire de contact.
- [ ] **Alertes** : e-mail à l'admin pour une nouvelle boutique à approuver, un nouveau message, une nouvelle commande.

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

**Décisions qui t'attendent** : outil de statistiques · durées de conservation des données · identité de la société (LLC) · retrait de la démonstration · tarifs de livraison · pays livrés · rémunération des points relais et agents · affichage d'un prix en dollars ou en euros.
