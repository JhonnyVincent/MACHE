# MACHÉ — architecture cible

Document de référence de la refonte. Il dit ce qui est **en place et
vérifié**, ce qui est **décidé**, et ce qui **attend une décision**.
Rien n'y est présenté comme fait tant que ça ne tourne pas.

---

## 1. Ce qui tourne, vérifié

### Backend commerce — `backend/`

Medusa 2.20.1 + Mercur 2.3.5, installés depuis npm (tous deux MIT).

| Vérification | Résultat |
|---|---|
| `medusa db:migrate` | 198 tables créées |
| `medusa develop` | « Server is ready on port 9000 » |
| `GET /health` | 200 |
| `GET /store/products` sans clé | 400 — clé publiable exigée, comportement correct |
| `GET /store/products` avec clé | produits réels |
| `GET /store/sellers` | vendeurs réels (couche Mercur) |
| `GET /vendor/sellers/me` sans jeton | 401 |
| `GET /dashboard` | panneau d'administration Medusa |
| `GET /seller` | panneau vendeur Mercur |
| `medusa exec seed.ts` | 3 vendeurs, 12 produits, 72 variantes, 244 offres |

Ce que le schéma apporte **sans une ligne de code à écrire** :

- produits, variantes, options, collections, catégories ;
- stock et inventaire multi-emplacements (`inventory_item`,
  `stock_location`, réservations) ;
- prix, listes de prix, règles de prix, devises, `price_list_seller`
  (tarifs par vendeur → socle du B2B) ;
- promotions et campagnes, y compris par vendeur ;
- panier, commande, lignes de commande, échanges, retours ;
- paiements et sessions de paiement, fulfillment, expéditions ;
- régions, zones fiscales, taux de taxe ;
- canaux de vente, clés d'API publiables ;
- **marketplace (Mercur)** : `seller`, `seller_member`, `seller_address`,
  `commission_rule`, `commission_rate`, `commission_line`, `payout`,
  `payout_account`, `order_seller`, avis vendeur.

### Storefront — racine du dépôt

Next.js 15 / React 19, déployé sur Vercel. Il reste **à la racine** et non
dans `apps/storefront` : déplacer la racine du projet Next obligerait à
changer le « Root Directory » du projet Vercel à la main, et casserait le
déploiement entre-temps. Le gain serait cosmétique.

---

## 2. Répartition des responsabilités

| Domaine | Où ça vit | Pourquoi |
|---|---|---|
| Catalogue, stock, prix, promotions, panier, commandes, paiements, taxes, expéditions | **Medusa** | Moteur éprouvé ; le réécrire prendrait un an |
| Vendeurs, commissions, payouts, commandes multi-vendeurs, panneau vendeur | **Mercur** | Couche marketplace au-dessus de Medusa, pas un second moteur |
| Rendu public, SEO, pages marketing, page d'accueil dynamique | **Next.js / Vercel** | Rendu au plus près de l'utilisateur |
| Images et fichiers | **Supabase Storage** *(décision en attente, §5)* | Déjà en place, CDN inclus |
| Comptes et sessions | **à décider** *(§5)* | Point le plus structurant |

**Règle de non-duplication** : une donnée commerce a **une seule** source
de vérité, Medusa. Le storefront ne recalcule ni un prix, ni un stock, ni
un total. Les tables commerce Supabase des migrations `0001`–`0006` ne
sont pas reprises.

---

## 3. Hébergement

Medusa est un serveur Node persistant avec Postgres et Redis. **Il ne peut
pas tourner sur Vercel** : les fonctions serverless n'ont ni processus
long, ni scheduler, ni connexions persistantes.

```
Vercel            →  storefront Next.js
Hébergeur Node    →  backend Medusa + Mercur (Railway, Render, Fly, Medusa Cloud…)
Postgres managé   →  base commerce
Redis managé      →  file d'événements, cache, verrous
```

En développement, Redis est facultatif : Medusa bascule sur une instance
factice en mémoire, et le dit dans ses logs. **En production, Redis est
obligatoire** — sans lui, les événements et les verrous ne survivent pas
au redémarrage.

---

## 4. Ce qui est conservé de l'existant

- `public/images/logo-haiti-mache-hibiscus.png` et
  `carte-haiti-mache.png` — les **deux seuls** fichiers image du dépôt ;
- la direction artistique : noir `#0a0a0a`, rouge `#d2162c`, bleu marine,
  Inter ;
- le système de composants du back-office (`src/components/seller/ui.tsx`) ;
- l'arborescence de 35 catégories (`src/lib/categories.ts`) ;
- **le principe de la page d'accueil vivante** : elle affiche ce qui se
  passe réellement sur la marketplace.

### Point à connaître sur les images

Les visuels de l'accueil, des pages `/sell` et des vitrines ne sont pas
des fichiers du projet : ce sont des **liens directs vers Unsplash**
(12 URLs distinctes). Photos de stock génériques, pas des produits MACHÉ.
Elles ne sont ni hébergées, ni sous licence négociée, ni fiables dans la
durée. Elles tiennent comme décor provisoire ; elles ne tiendront pas en
production.

---

## 5. Décisions en attente

Elles ne bloquent pas le socle, mais commandent la suite.

1. **Comptes et sessions.** Medusa a son propre système
   (`customer`, `user`, `seller_member`, jetons JWT), dont dépend le
   panneau vendeur Mercur. Supabase Auth a le vôtre, avec vos comptes
   actuels. Garder les deux, c'est deux annuaires à synchroniser — la
   « impression de plusieurs logiciels assemblés » à éviter.
2. **Hébergeur du backend** — ordre de grandeur 20 à 50 $/mois.
3. **Sort des données Supabase actuelles.** Les migrations `0001`–`0006`
   n'ont jamais été appliquées : il n'y a probablement rien à migrer, mais
   l'environnement de travail n'a pas accès au projet Supabase pour le
   vérifier.

---

## 6. Suite

| Étape | État |
|---|---|
| 1. Audit | fait |
| 2. Sauvegarde (`pre-replatform-v1`) | fait |
| 3. Assets | fait — 2 fichiers, 12 liens Unsplash recensés |
| 4. Architecture cible | ce document |
| 5. Installation Medusa / Mercur | fait et vérifié |
| 6. Connexion storefront ↔ backend | suivant |
| 7. Homepage marketplace dynamique | suivant |
| 8 à 20 | Seller Center, admin, paiements, Puck, thèmes, IA, Nango, abonnements, B2B, sécurité, tests, production |

---

## 7. Démarrer en local

```bash
# Postgres et Redis doivent tourner
createdb mache_commerce
cd backend && bun install
cp packages/api/.env.example packages/api/.env   # puis renseigner
cd packages/api
./node_modules/.bin/medusa db:migrate
./node_modules/.bin/medusa exec ./src/scripts/seed.ts   # données de démonstration
./node_modules/.bin/medusa develop
```

- API : http://localhost:9000
- Administration : http://localhost:9000/dashboard
- Espace vendeur : http://localhost:9000/seller

**Mercur impose `bun`.** Sous npm, le template échoue sur un conflit de
peer dependencies entre `react-hook-form@7.49.1` et `@hookform/resolvers@5.4.0`.
