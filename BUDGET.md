# Budget du site MACHE (hébergement, domaine, services)

Périmètre : **le site uniquement**. Pas de publicité ni de communication, et pas les frais de paiement (Nium et autres), traités à part dans `A-FAIRE.md`.

Prix relevés le 3 octobre 2026, en dollars américains, sur les pages officielles ou des comparatifs (liens en bas). Un prix peut changer : **à revérifier au moment de payer**. Les lignes marquées « estimation » sont mon jugement, pas un chiffre publié.

## 1. Aujourd'hui : 0 $ par mois, mais seulement pour la démonstration

Tout est sur le plan gratuit de Render. Trois limites qui interdisent de vendre pour de vrai :

- la base de données gratuite **est supprimée au bout de 30 jours** ;
- les services gratuits **s'endorment** après 15 minutes sans visite (une minute d'attente au réveil) ;
- les photos de produits sont écrites sur le disque du serveur, qui est **effacé à chaque mise à jour** (voir 2.5).

## 2. Ce qu'il faut payer pour de vrais clients

| Poste | Rôle | Prix par mois | Remarque |
|---|---|---|---|
| 2.1 Site (Next.js, `MACHE-1`) | pages vues par les clients | 7 $ (Starter, 512 Mo) ou 25 $ (Standard, 2 Go) | Starter suffit au début. |
| 2.2 Backend (`mache-backend`) | catalogue, commandes, comptes | 25 $ (Standard, 2 Go) | Estimation : 512 Mo est probablement trop juste pour Medusa. |
| 2.3 Base de données (`mache-db`) | produits, vendeurs, commandes | 19 $ (Basic 1 Go) ; 6 $ (256 Mo) trop petit | Sauvegardes comprises, à vérifier dans le tableau de bord. |
| 2.4 Sessions (Redis, `mache-sessions`) | connexions, tâches | 10 $ (Starter) | Évite de perdre les e-mails en cours lors d'un redémarrage. |
| 2.5 Stockage des photos | garder les images | 0 à 1 $ | Deux options : un disque Render sur le backend (environ 0,25 $ par Go, à confirmer), ou Cloudflare R2 (10 Go gratuits, puis 0,015 $ par Go, sans frais de téléchargement), qui demande une petite modification du code. |
| 2.6 Compte Render | l'espace de travail | 0 $ (Hobby) ou 25 $ (Pro) | Pro apporte plus de bande passante et de fonctions d'équipe ; Hobby suffit pour commencer. |

**Total mensuel**

| Scénario | Détail | Par mois |
|---|---|---|
| Lancement | site Starter + backend Standard + base 1 Go + Redis + Hobby | **61 $** |
| Confortable | site Standard + backend Standard + base 1 Go + Redis + Pro | **104 $** |

Un dépassement de bande passante coûte 0,15 $ par Go supplémentaire, et un domaine personnalisé supplémentaire 0,25 $ par mois.

## 3. Nom de domaine

| Option | Prix | Remarque |
|---|---|---|
| `.com` chez Cloudflare Registrar | **10,46 $ par an**, renouvellement au même prix | environ 0,90 $ par mois ; recommandé |
| `.ht` (Haïti) | **environ 85 à 90 $ par an** chez les registraires les moins chers | plus cher, mais un signal local fort ; optionnel |

À réserver aussi : la version sans accent du nom, pour qu'on n'en vole pas la variante.

## 4. E-mails du site (confirmations, mots de passe, commandes)

| Offre | Prix | Quand |
|---|---|---|
| Brevo gratuit | 0 $, 300 e-mails par jour | tant que les envois quotidiens restent sous 300 |
| Brevo Starter | 9 $ par mois, 5 000 e-mails | dès que 300 par jour ne suffisent plus |

Le domaine doit être authentifié chez Brevo pour que les messages n'arrivent pas en spam.

## 5. Traduction automatique des fiches produits

| Service | Gratuit | Au-delà | Remarque |
|---|---|---|---|
| **Google Cloud Translation** | 500 000 caractères par mois | 20 $ le million de caractères | conseillé : le palier gratuit est reconduit chaque mois |
| DeepL | 500 000 caractères par mois (API Free) | 25 $ le million, plus 5,49 $ par mois (API Pro) | un comparatif indique que Free et Pro sont **fermés aux nouveaux inscrits**, avec une offre Growth à 32,50 $ par mois : à confirmer sur leur site |

Calcul pour MACHE (estimation) : une fiche fait environ 500 caractères. 1 000 fiches traduites en 3 langues font 1,5 million de caractères, donc **environ 20 $ une seule fois**, car chaque fiche est traduite une fois puis conservée. Un catalogue de 1 000 fiches tient dans le palier gratuit si on traduit une langue par mois. Les textes du site (menus, boutons) se traduisent une fois à la main ou avec ce même outil, pour quelques centimes.

## 6. Ce qui reste à 0 $

Le code (aucun abonnement), le certificat HTTPS (inclus par Render), les statistiques sans cookies (maison), la bibliothèque de langues next-intl (libre).

## 7. Budget à retenir

| | Par mois | Par an |
|---|---|---|
| Lancement | 61 $ | 732 $ |
| Domaine `.com` | 0,90 $ | 10,46 $ |
| E-mails | 0 $ | 0 $ |
| Traduction | 0 $ | 0 à 20 $ la première année |
| Imprévus (15 %) | 9,30 $ | 112 $ |
| **Total lancement** | **environ 71 $** | **environ 855 $** |

Confortable : environ 120 $ par mois (environ 1 450 $ par an), si le trafic ou les besoins d'équipe l'exigent.

## 8. Sources

- Render : [tarifs](https://render.com/pricing.md), [nouveaux plans d'espace de travail](https://render.com/docs/new-workspace-plans)
- [Google Cloud Translation](https://cloud.google.com/translate/pricing)
- [DeepL et comparatif des coûts](https://simplelocalize.io/blog/posts/ai-machine-translation-cost-comparison/)
- [Brevo (comparatif 2026)](https://www.omnisend.com/blog/brevo-pricing/)
- [Cloudflare, `.com`](https://domainoffer.net/tld/com/cloudflare) et [registraires `.ht`](https://domainoffer.net/tld/ht/whc)
- [Cloudflare R2](https://developers.cloudflare.com/r2/pricing)
