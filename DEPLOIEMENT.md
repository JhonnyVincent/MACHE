# Mettre MACHÉ en ligne

MACHÉ est en deux morceaux, et c'est volontaire.

| Morceau | Où il vit | Pourquoi là |
|---|---|---|
| **Le site** (`src/`) | Vercel | Next.js, rendu à la demande. C'est déjà le cas. |
| **Le backend commerce** (`backend/`) | Render, Fly.io, Railway… | Medusa + Mercur : un serveur Node qui tourne en permanence, avec PostgreSQL. Il ne peut pas tourner en *serverless*, donc pas sur Vercel. |

Tant que le second n'est pas en ligne, le site fonctionne mais son
catalogue est vide : il n'a personne à qui demander les produits.

---

## Où est le backend

Dans ce dépôt, dossier **`backend/`**. Il n'est pas ailleurs, et il n'y a
rien à télécharger.

```
backend/
├── packages/api/     ← le serveur Medusa + Mercur
├── apps/admin/       ← le panneau MACHÉ (administration)
├── apps/vendor/      ← le panneau vendeur
└── package.json
```

Le fichier **`render.yaml`**, à la racine du dépôt, décrit déjà le
service et la base de données pour Render. Lisez-le : il dit sans détour
ce que le plan gratuit implique (base supprimée au bout de 30 jours,
service endormi après 15 minutes, pas de Redis).

---

## 1. Déployer le backend sur Render

1. Sur **render.com**, `New` → **`Blueprint`**.
2. Choisir le dépôt **`JhonnyVincent/MACHE`**, branche **`main`**.
   Render lit `render.yaml` tout seul et propose deux ressources :
   le service web `mache-backend` et la base `mache-db`.
3. Render demande **une seule valeur** :

   | Variable | Valeur |
   |---|---|
   | `STOREFRONT_URL` | `https://VOTRE-SITE.vercel.app` — l'adresse de votre site, sans `/` final |

   Tout le reste se déduit : les quatre listes d'origines autorisées
   (`STORE_CORS`, `ADMIN_CORS`, `VENDOR_CORS`, `AUTH_CORS`) et l'adresse
   des images se calculent à partir de cette adresse et de celle du
   serveur, que Render fournit lui-même.

   `DATABASE_URL` et les trois secrets (`JWT_SECRET`, `COOKIE_SECRET`,
   `STOREFRONT_REVALIDATE_SECRET`) sont générés par Render : n'y touchez
   pas. Les deux premiers signent les sessions ; leur donner une valeur
   connue reviendrait à laisser la clé sur la porte.

4. `Apply`. Le premier déploiement prend une dizaine de minutes : il
   installe les dépendances, construit le serveur, applique les
   migrations, puis crée la région Haïti et la clé publique du site.
5. Quand le service est `Live`, ouvrir `https://mache-backend.onrender.com/health`.
   Il doit répondre. Si oui, le backend tourne.

> Vous n'avez pas encore d'adresse Vercel ? Mettez-y n'importe quelle
> adresse valide et corrigez-la ensuite : `STOREFRONT_URL` se modifie
> depuis l'onglet `Environment` du service, et Render redéploie seul.

## 2. Relever les trois valeurs

Le backend se met en place tout seul au démarrage : région **Haïti** en
**gourdes (HTG)**, région fiscale, canal de vente, et la clé publique
qui autorise le site à lire le catalogue. Rien à taper dans un terminal.

Aucun taux de taxe n'est fixé : c'est une décision fiscale, elle vous
revient.

Ouvrez l'onglet **`Logs`** du service sur Render. Au démarrage, le
backend affiche un encadré :

```
========================================================
  À reporter dans les variables d'environnement du site
  (Vercel → Settings → Environment Variables), PUIS
  REDÉPLOYER : ces valeurs sont lues à la construction.
--------------------------------------------------------
  NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://mache-backend.onrender.com
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
  NEXT_PUBLIC_MEDUSA_REGION_ID=reg_...
========================================================
```

Copiez ces trois lignes.

Pour entrer dans le panneau d'administration, créez-vous un compte
depuis l'onglet **`Shell`** du service :

```bash
cd packages/api
./node_modules/.bin/medusa user --email vous@exemple.ht --password VOTRE_MOT_DE_PASSE
```

Le panneau est ensuite sur `https://mache-backend.onrender.com/dashboard`,
et le panneau vendeur sur `https://mache-backend.onrender.com/seller`.

## 3. Brancher le site sur le backend

Dans **Vercel** → votre projet → `Settings` → `Environment Variables`,
ajoutez les trois lignes relevées à l'étape 2 :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://mache-backend.onrender.com` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | la clé `pk_…` |
| `NEXT_PUBLIC_MEDUSA_REGION_ID` | l'identifiant `reg_…` |

Puis **redéployez**. Ce point n'est pas optionnel : les variables
`NEXT_PUBLIC_*` sont inscrites dans le code au moment de la
construction, pas lues au démarrage. Les ajouter sans redéployer ne
change rien, et c'est le piège le plus courant.

### Une quatrième, facultative

| Variable | Valeur |
|---|---|
| `STOREFRONT_REVALIDATE_SECRET` | la valeur générée par Render, onglet `Environment` du service |

Elle autorise le backend à vider le cache du site dès qu'un prix ou un
produit change. Sans elle, le site reste juste, avec jusqu'à une minute
de retard. Avec elle, la modification est visible immédiatement.

## 4. Vérifier

Dans cet ordre :

1. `https://VOTRE-SITE.vercel.app/shop` affiche des produits.
   Vide ? Le backend n'a pas encore de catalogue — voir ci-dessous.
2. L'accueil montre « Nouveautés » et « Nouvelles boutiques ».
3. Un produit s'ajoute au panier, et le panier le retient d'une page à
   l'autre.

Si `/shop` reste vide alors que `/health` répond, c'est que le backend
n'a aucun produit : un vendeur doit en créer depuis
`https://mache-backend.onrender.com/seller`, ou vous pouvez charger le
catalogue de démonstration de Mercur, depuis l'onglet `Shell` :
`cd packages/api && ./node_modules/.bin/medusa exec ./src/scripts/seed.ts`.
Ce catalogue est une **démonstration** : des chaussures en euros. Ne le
laissez pas en ligne devant de vrais clients.

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
- **Le passage aux plans payants**, avant la première vente réelle : sur
  le plan gratuit, la base de données est supprimée au bout de 30 jours.
