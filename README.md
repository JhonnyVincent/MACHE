# MACHÉ

Marketplace haïtienne : des boutiques indépendantes, des marques et des
fournisseurs d'Haïti et de la diaspora, réunis sur une seule place de
marché. Chaque vendeur garde sa boutique ; le client n'a qu'un panier.

## Comment c'est fait

Deux morceaux, pour une raison précise.

| Morceau | Technologie | Rôle |
|---|---|---|
| `src/` | Next.js 15 (App Router), React 19, TypeScript, Tailwind | Le site : accueil, catalogue, fiche produit, panier, commande, espace client, vitrines de boutiques. |
| `backend/` | Medusa 2 + Mercur, PostgreSQL | Le moteur commerce : produits, offres, vendeurs, panier, commandes, versements. |

Le site ne possède pas le catalogue : il le demande au backend. Il n'y a
donc pas deux vérités sur le stock, sur les prix ou sur les commandes.

**Mercur** apporte la couche marketplace : un produit n'appartient à
personne, ce sont des **offres** qui relient un vendeur à une déclinaison.
Deux vendeurs peuvent proposer le même article à deux prix. Une commande
portant sur deux vendeurs devient un *order group* : une commande pour le
client, deux commandes vendeur.

Supabase ne sert plus qu'aux rôles internes de MACHÉ (administration,
agents, partenaires).

## Ce qui marche aujourd'hui

- Catalogue, recherche, catégories, fiche produit avec ses vendeurs
  concurrents
- Panier multi-vendeurs et commande de bout en bout, livraison calculée
  par vendeur
- **Prix dégressifs (B2B)** : le tarif par palier de quantité, lu depuis
  le moteur — vérifié à cinq unités, pas seulement affiché
- Compte client, historique et suivi des commandes
- **Vitrines personnalisables** : chaque vendeur compose sa page avec des
  blocs, au formulaire ou en glisser-déposer (voir ci-dessous)
- Panneau vendeur et panneau d'administration, servis par Mercur

Le paiement se fait à la livraison. **Aucun paiement en ligne n'est
simulé** : tant qu'aucun prestataire réel n'est branché, le site ne
prétend pas encaisser.

## Vitrines : deux éditeurs, une seule donnée

Un vendeur compose sa page avec des blocs (bandeau, texte, image, grille
de produits, questions fréquentes, compte à rebours…).

- `/dashboard/seller/vitrine` — éditeur en formulaire. Fonctionne sans
  JavaScript et sur une connexion lente ; chaque bloc s'enregistre seul.
- `/dashboard/seller/vitrine/editeur` — éditeur visuel (Puck). L'aperçu
  emploie les composants qui rendent la page publique, avec les vrais
  produits de la boutique : ce n'est pas une imitation.

Les deux écrivent le même format, dans `seller.metadata.storefront`. On
passe de l'un à l'autre sans rien reprendre.

Tout ce qui vient du navigateur est renettoyé côté serveur avant d'être
enregistré : seuls les blocs déclarés, seuls leurs champs déclarés, et un
lien `javascript:` ou une image `data:` sont refusés à l'écriture comme à
l'affichage. Ces garanties sont vérifiées par `npm run test:vitrine`.

## Démarrer en local

```bash
# 1. Le backend commerce
cd backend
bun install                      # Mercur impose bun
cp packages/api/.env.example packages/api/.env
# renseigner DATABASE_URL, JWT_SECRET, COOKIE_SECRET, STOREFRONT_URL
cd packages/api
./node_modules/.bin/medusa db:migrate
./node_modules/.bin/medusa exec ./src/scripts/setup-mache.ts   # région Haïti, en gourdes
./node_modules/.bin/medusa develop                             # http://localhost:9000

# 2. Le site
cd ../../..
npm install
cp .env.example .env.local       # renseigner les trois NEXT_PUBLIC_MEDUSA_*
npm run dev                      # http://localhost:3000
```

Le panneau d'administration est sur `http://localhost:9000/dashboard`,
le panneau vendeur sur `http://localhost:9000/seller`.

## Cache

Le site met les réponses de Medusa en cache. Quand un vendeur change un
prix, le backend appelle `/api/revalidate` avec les étiquettes
concernées et le cache correspondant se vide aussitôt.

Les deux moitiés doivent employer exactement les mêmes noms
d'étiquettes : `src/lib/medusa/catalog.ts` les écrit,
`backend/packages/api/src/subscribers/storefront-cache-revalidate.ts`
les envoie. Une étiquette qui diffère d'un caractère ne correspond à
rien, sans erreur ni journal. Le vocabulaire est documenté dans les
deux fichiers.

Sans le secret partagé, le site reste juste, avec jusqu'à une minute de
retard.

## Vérifications

```bash
npx tsc --noEmit        # types
npm test                # vitrines et configuration
npx next build          # construction complète
```

## Mise en ligne

Tout est hébergé sur **Render** : le site, le backend commerce et la
base de données, dans la même région.

Voir **[DEPLOIEMENT.md](./DEPLOIEMENT.md)** : les trois ressources, leur
ordre de création, et les variables à renseigner de part et d'autre.

Les décisions qui ne sont pas techniques — le taux de taxe, la commission
MACHÉ, le prestataire de paiement — y sont listées telles quelles, parce
qu'elles ne peuvent pas être prises à votre place.

## Pour comprendre les choix

**[ARCHITECTURE.md](./ARCHITECTURE.md)** consigne ce qui a été vérifié et
ce qui a été décidé, avec les raisons.
