# Mettre MACHÉ en ligne

Tout est hébergé sur **Render**, en trois ressources.

| Ressource | Ce que c'est |
|---|---|
| `MACHE-1` | le site Next.js, ce que voient les clients |
| `mache-backend` | le moteur commerce : Medusa + Mercur |
| `mache-db` | la base PostgreSQL |

Les deux services sont séparés parce qu'ils ne font pas le même
métier : le site rend des pages, le backend tient le catalogue, les
stocks et les commandes. Le site ne possède rien ; il demande tout au
backend.

---

## Avant de commencer : ce que le plan gratuit implique

- La base PostgreSQL gratuite **expire au bout de 30 jours** et est
  supprimée. Produits, vendeurs, commandes : tout disparaît. Acceptable
  pour une démonstration, jamais pour de vraies ventes.
- Un service gratuit **s'endort après 15 minutes** sans trafic. Le
  réveil prend environ une minute : la première visite après une période
  calme paraîtra cassée. Pour une démonstration, ouvrez le site une
  minute avant.
- Pas de Redis : Medusa bascule sur une file d'événements en mémoire. Un
  événement en cours au moment d'un redémarrage est perdu — un e-mail de
  confirmation, une mise à jour de stock.

Passer aux plans payants est une étape distincte, à faire **avant
d'accepter le moindre paiement réel**.

---

## 1. Le backend et la base

Sur **render.com** : `New` → **`Blueprint`** → dépôt
`JhonnyVincent/MACHE` → branche `main`.

Render lit `render.yaml` et propose `mache-backend` et `mache-db`.

Il demande **une seule valeur** :

| Variable | Valeur |
|---|---|
| `STOREFRONT_URL` | l'adresse de votre site, sans `/` final |

Vous ne la connaissez pas encore si le site n'est pas déployé : mettez
une valeur provisoire et corrigez-la à l'étape 3. Elle se modifie depuis
l'onglet `Environment`, et Render redéploie seul.

Le reste se déduit : les quatre listes d'origines autorisées
(`STORE_CORS`, `ADMIN_CORS`, `VENDOR_CORS`, `AUTH_CORS`) et l'adresse
des images se calculent à partir de cette adresse et de celle du serveur,
que Render fournit lui-même. `DATABASE_URL` et les trois secrets sont
générés : n'y touchez pas.

`Apply`. Comptez une dizaine de minutes.

---

## 2. Le site

`New` → **`Web Service`** → même dépôt → branche `main`.

| Réglage | Valeur |
|---|---|
| **Root Directory** | *laisser vide* |
| Build Command | `npm run build` |
| Start Command | `npm run start` |
| Region | **`frankfurt`**, la même que le backend |

**Le Root Directory doit rester vide.** S'il contient `backend`, Render
installe le moteur commerce au lieu du site, et l'installation échoue
sur un conflit de dépendances qui ne dit pas d'où il vient.

**La région compte.** Chaque page du site fait plusieurs appels au
backend, côté serveur. Si les deux services sont sur des continents
différents, chaque appel traverse l'océan : 150 à 200 ms perdues, à
chaque appel, à chaque page.

Laissez les variables d'environnement vides pour l'instant.

---

## 3. Relier les deux

### Le backend doit connaître le site

`mache-backend` → `Environment` :

| Variable | Valeur |
|---|---|
| `STOREFRONT_URL` | l'adresse de `MACHE-1`, sans `/` final |

Sans elle, le navigateur refusera les appels du site au backend.

### « Dashboard not built » sur /seller ou /dashboard

Le backend sert ce message quand les panneaux n'ont pas été construits.
Sans panneau, un vendeur ne peut ni ajouter un produit, ni voir une
commande : c'est bloquant.

Deux causes, corrigées toutes les deux dans le dépôt — mais si vous avez
créé le service à la main, vérifiez sa commande de construction :

| | Valeur attendue |
|---|---|
| **Build Command** | `npm install -g bun && bun install && bun run build` |
| **Start Command** | celle du `render.yaml` (migrations, amorçage, `medusa start`) |
| **Root Directory** | `backend` |

`medusa build` seul ne suffit pas : il compile le serveur, mais ne
construit ni les deux panneaux ni leur empaquetage dans l'artefact.

### `MERCUR_BACKEND_URL`, à ne pas oublier

Les panneaux **gravent** l'adresse du backend au moment de la
construction : c'est celle qu'ils appelleront depuis le navigateur du
vendeur.

Posez `MERCUR_BACKEND_URL` sur `mache-backend` avec sa propre adresse
publique (`https://mache-backend.onrender.com`, sans `/` final), puis
reconstruisez.

Sans elle, les panneaux sont construits en pointant vers
`http://localhost:9000` : ils s'affichent, et chaque action échoue sans
que rien ne l'explique. Elle ne peut pas se déduire automatiquement —
Render ne fournit pas `RENDER_EXTERNAL_URL` pendant la construction.

### Le compte d'administration MACHÉ

L'administration du site s'authentifie sur les comptes **du personnel
Medusa**, pas sur Supabase.

Il n'y a pas d'inscription publique, et c'est délibéré : ouvrir la
création de comptes d'administration d'une marketplace reviendrait à
laisser la porte du coffre sur le palier. Le compte se crée donc au
démarrage du backend, par deux variables.

Sur `mache-backend` → `Environment` :

| Variable | Valeur |
|---|---|
| `ADMIN_EMAIL` | l'adresse qui vous connectera |
| `ADMIN_PASSWORD` | au moins 8 caractères |

Puis **`Manual Deploy`**. Au démarrage, le backend crée le compte et
l'annonce dans ses journaux.

**Retirez ensuite les deux variables.** Le compte reste ; le mot de
passe, lui, n'a pas à rester lisible par quiconque ouvre le tableau de
bord de l'hébergeur.

Ce compte ouvre `/dashboard/admin` sur le site **et** le panneau complet
du backend — c'est le même identifiant.

**Le mot de passe d'un compte existant n'est jamais réécrit.** Les
variables peuvent rester en place sans danger : à chaque redémarrage le
backend constate que l'adresse existe déjà et n'y touche pas. Sans
cette règle, un redéploiement annulerait silencieusement tout changement
de mot de passe fait depuis — y compris celui qu'on vient de faire après
une fuite.

Le terminal reste possible là où l'hébergeur en offre un
(`medusa user -e ... -p ...`), mais il n'est plus nécessaire : le plan
gratuit de Render n'a pas d'onglet `Shell`.

### Deux services, deux jeux de variables — ne pas les mélanger

C'est l'erreur la plus coûteuse, parce qu'elle ne produit aucun message
d'erreur : une variable posée sur le mauvais service est simplement
ignorée, et le service se comporte comme si elle n'existait pas.

| Sur le **backend** (`mache-backend`) | Sur le **site** (`MACHE-1`) |
|---|---|
| `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET` | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` |
| `STOREFRONT_URL` | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |
| `STOREFRONT_REVALIDATE_URL`, `STOREFRONT_REVALIDATE_SECRET` | `NEXT_PUBLIC_MEDUSA_REGION_ID` |
| `STORE_CORS`, `ADMIN_CORS`, `VENDOR_CORS`, `AUTH_CORS` | `STOREFRONT_REVALIDATE_SECRET` |
| `SEED_DEMO`, `DEMO_HTG_FACTOR`, `DEMO_SHIPPING_HTG` | |

`STORE_CORS`, `VENDOR_CORS` et `STOREFRONT_REVALIDATE_URL` sur le site
ne font rien : ce sont des réglages du serveur commerce. Les y laisser
n'abîme rien, mais donne l'impression que le site est configuré alors
qu'il ne l'est pas.

Et si une variable `*_CORS` du backend pointe encore vers une ancienne
adresse — un déploiement Vercel abandonné, par exemple — elle prend le
pas sur celle que `STOREFRONT_URL` déduit, et le navigateur refusera
tous les appels du site au backend. Supprimez-la plutôt que de la
corriger : sans elle, l'adresse se déduit toute seule.

### Auto-Deploy : le piège « After CI Checks Pass »

Render propose de ne déployer qu'une fois les vérifications
d'intégration continue réussies. Réglé ainsi sur un dépôt qui n'en a
aucune, il attend des vérifications qui ne viendront jamais — et ne
déploie plus, sans rien signaler. De son point de vue il attend
patiemment ; du vôtre, le site se fige sur une vieille version pendant
que les commits s'accumulent.

Le dépôt fournit désormais ces vérifications
(`.github/workflows/ci.yml` : construction du site et suite de tests),
donc ce réglage fonctionne. Si un déploiement ne part toujours pas,
basculez sur **`On Commit`** et regardez l'onglet `Actions` de GitHub
pour savoir ce qui échoue.

### Le site doit connaître le backend

Le backend se met en place seul au démarrage : région **Haïti** en
**gourdes**, région fiscale, canal de vente, et la clé publique qui
autorise le site à lire le catalogue. Rien à taper dans un terminal.

Aucun taux de taxe n'est fixé : c'est une décision fiscale, elle vous
revient.

Ouvrez `mache-backend` → onglet **`Logs`**, cherchez `NEXT_PUBLIC`.
Le backend y affiche :

```
========================================================
  À reporter dans les variables d'environnement du site
--------------------------------------------------------
  NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://...onrender.com
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
  NEXT_PUBLIC_MEDUSA_REGION_ID=reg_...
========================================================
```

Ne copiez que ce qui suit le `=` : les journaux préfixent chaque ligne.

Reportez les trois dans `MACHE-1` → `Environment`, puis
**`Manual Deploy`** → `Deploy latest commit`.

**Ce redéploiement n'est pas optionnel.** Les variables `NEXT_PUBLIC_*`
sont inscrites dans le code au moment de la construction, pas lues au
démarrage. Les ajouter sans reconstruire ne change rien — c'est le piège
qui fait perdre le plus de temps.

### Une quatrième, facultative

| Variable | Valeur |
|---|---|
| `STOREFRONT_REVALIDATE_SECRET` | la valeur générée dans `mache-backend` → `Environment` |

Elle autorise le backend à vider le cache du site dès qu'un prix change.
Sans elle, le site reste juste, avec jusqu'à une minute de retard. Avec
elle, la modification est visible immédiatement.

---

## 4. Vérifier

Dans cet ordre :

1. `https://VOTRE-BACKEND.onrender.com/health` répond.
2. `https://VOTRE-SITE.onrender.com/shop` affiche des produits.
3. L'accueil montre « Nouveautés » et « Nouvelles boutiques ».
4. Un produit s'ajoute au panier, et le panier le retient d'une page à
   l'autre.

Si `/shop` dit « Catalogue momentanément indisponible », le site ne joint
pas le backend : vérifiez les trois variables et le redéploiement. S'il
dit « Le catalogue est vide », le site joint bien le backend, qui n'a
simplement aucun produit.

---

## 5. Remplir le catalogue

### Un vrai vendeur

Depuis `https://VOTRE-BACKEND.onrender.com/seller`, créez une boutique
et ses produits. C'est le parcours réel, celui que suivront vos vendeurs.

Pour entrer dans le panneau d'administration, créez-vous un compte
depuis l'onglet `Shell` de `mache-backend` :

```bash
cd packages/api
./node_modules/.bin/medusa user --email vous@exemple.ht --password VOTRE_MOT_DE_PASSE
```

Le panneau est alors sur `https://VOTRE-BACKEND.onrender.com/dashboard`.

### Le catalogue de démonstration

Pour voir la plateforme vivante tout de suite, sans terminal :

`mache-backend` → `Environment` :

| Variable | Valeur |
|---|---|
| `SEED_DEMO` | `true` |

Render redéploie, et le catalogue se charge : 3 boutiques, 12 produits,
244 offres. **Retirez ensuite la variable.**

Trois garanties, vérifiées :

- il ne charge rien si le catalogue contient déjà un produit. La
  démonstration ne s'ajoute jamais au milieu de vrais produits et de
  vraies commandes ;
- il ne touche pas à la région Haïti. La démonstration crée une région
  « Europe » en euros et voudrait en faire la région par défaut ; la
  mise en place MACHÉ passe après elle et rétablit Haïti ;
- il donne aux articles un prix **en gourdes**. Sans cela, le catalogue
  s'affichait avec « Prix indisponible » partout et rien ne pouvait
  entrer dans un panier : Medusa refuse de calculer un prix dans une
  devise pour laquelle aucun prix n'existe, et la démonstration Mercur
  est chiffrée en euros.

  Le catalogue devient aussi **livrable en Haïti** : les zones de
  livraison de la démonstration ne couvraient que sept pays d'Europe, et
  le passage en caisse s'arrêtait faute de mode d'expédition. Le tarif
  posé est un montant de démonstration, réglable avec
  `DEMO_SHIPPING_HTG` — livrer à Jacmel ne coûte pas ce que coûte
  livrer à Delmas, et ce n'est pas à ce script d'en décider.

  Ces montants ne viennent d'**aucun taux de change**. Ce sont des
  chaussures fictives : les prix en euros sont multipliés par un facteur
  d'affichage, réglable avec `DEMO_HTG_FACTOR`, pour obtenir des ordres
  de grandeur plausibles. Le backend l'écrit dans ses journaux.

Ce catalogue est une **démonstration** : des chaussures fictives, en
euros, avec des vendeurs fictifs. Ne le laissez pas en ligne devant de
vrais clients — un catalogue inventé qui reste affiché fait passer pour
des offres ce qui n'en est pas.

---

## Ce qui reste à décider — et qui ne peut pas l'être à votre place

- **Les taxes.** Aucun taux n'est fixé. C'est une obligation légale, pas
  un réglage technique.
- **La commission MACHÉ.** Mercur la gère nativement, mais son taux est
  une décision commerciale.
- **Le moyen de paiement.** Aujourd'hui, seule la livraison contre
  paiement en main propre est proposée. Aucun paiement en ligne n'est
  simulé : tant qu'aucun prestataire réel n'est branché, le site ne
  prétend pas encaisser.
- **Le passage aux plans payants**, avant la première vente réelle.
