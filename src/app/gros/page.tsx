/*
  PAGE : trouver un fournisseur.

  Pourquoi elle existe

  MACHE avait tout le nécessaire pour le commerce entre professionnels —
  demandes de devis, prix dégressifs, commande minimum par boutique —
  et aucun moyen d'y accéder. Un vendeur qui cherche à s'approvisionner
  devait parcourir le catalogue article par article en espérant tomber
  sur un grossiste.

  Qui la voit

  Les fournisseurs ne s'adressent pas au public : un grossiste ne vend
  pas à l'unité, et une marque confie ses produits à des revendeurs.
  Cette page est donc réservée à deux publics (voir src/lib/trade-access.ts) :

  - les VENDEURS connectés — un particulier, une boutique, une marque ou
    un grossiste qui cherche un fournisseur ;
  - les ACHETEURS PROFESSIONNELS validés par MACHE — hôtels, écoles,
    restaurants, entreprises — qui achètent en quantité sans vendre.

  Les autres voient ce que c'est et comment y accéder, pas la liste.

  Ce qu'elle dit, et ne dit pas

  Le profil est une DÉCLARATION du vendeur, pas un contrôle de MACHE :
  `seller.metadata` est écrit par le vendeur. Cette page liste donc les
  boutiques qui se présentent comme grossistes ou comme marques, et
  l'écrit dans ces termes. Laisser entendre que MACHE les a vérifiées
  serait leur prêter une caution qui n'existe pas.

  Et quand personne ne s'est déclaré, elle le dit. Une page remplie
  d'exemples inventés ferait perdre son temps à un acheteur, et perdre
  sa confiance à MACHE.
*/

import { Link } from "next-view-transitions";
import { fetchSellers } from "@/lib/medusa/catalog";
import { readSellerProfile, profileInfo, type SellerProfile } from "@/lib/seller-profile";
import { readSellerMinimum } from "@/lib/seller-minimum";
import { formatAmount } from "@/lib/format";
import { VerifiedBadge } from "@/components/verified-badge";
import { reportOutage } from "@/lib/medusa/outage";
import { getTradeAccess } from "@/lib/trade-access";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Trouver un fournisseur",
  description:
    "Grossistes et marques haïtiennes pour les vendeurs et les professionnels : demande de devis, prix selon la quantité, commande minimum.",
  path: "/gros",
});

/*
  Ce qui existe réellement pour acheter en quantité. Chaque ligne
  renvoie à un mécanisme en service, pas à une intention.
*/
const HOW = [
  {
    title: "Demander un devis",
    text: "Depuis la fiche d'un produit, vous indiquez une quantité : le fournisseur répond par un prix total et une date de validité. Rien n'est réservé, rien n'est payé tant que vous n'avez pas accepté.",
  },
  {
    title: "Prix selon la quantité",
    text: "Certains fournisseurs affichent leurs paliers sur la fiche produit : le prix unitaire baisse à partir d'une quantité. Vous les voyez avant d'acheter, pas dans le panier.",
  },
  {
    title: "Commande minimum",
    text: "Un fournisseur peut fixer un montant en dessous duquel il ne vend pas. Il est annoncé ici et vérifié au moment de la commande.",
  },
];

/* Qui est un fournisseur : un grossiste, ou une marque. */
const SUPPLIER_PROFILES: SellerProfile[] = ["fournisseur", "marque"];

const FILTERS: Array<{ key: "tous" | SellerProfile; label: string }> = [
  { key: "tous", label: "Tous" },
  { key: "fournisseur", label: "Grossistes" },
  { key: "marque", label: "Marques" },
];

export default async function SupplierPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const access = await getTradeAccess();

  /* ---------------------------------------------------------------- */
  /* Le visiteur n'y a pas accès : on explique, on n'expose rien.     */
  /* ---------------------------------------------------------------- */
  if (!access.allowed) {
    const pending = access.proStatus === "pending";
    const refused = access.proStatus === "refused";

    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
          Trouver un fournisseur
        </h1>

        <p className="mt-3 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
          Les grossistes et les marques de MACHE vendent par quantité, à des professionnels. Leur liste, leurs
          produits et leurs devis sont réservés à deux publics.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
            <h2 className="text-lg font-bold text-[var(--mache-text)]">Vous vendez sur MACHE</h2>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
              Particulier, boutique, marque ou grossiste : un vendeur est aussi un acheteur. Connectez-vous à votre
              MACHE Boutik pour trouver des fournisseurs et leur demander un prix.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/seller/connexion"
                className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
              >
                Me connecter
              </Link>
              <Link
                href="/dashboard/seller/inscription"
                className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-base font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
              >
                Ouvrir ma boutique
              </Link>
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
            <h2 className="text-lg font-bold text-[var(--mache-text)]">Vous achetez pour une organisation</h2>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
              Hôtel, école, restaurant, entreprise, association : demandez un compte professionnel. MACHE le valide,
              sans que vous ayez à vendre quoi que ce soit.
            </p>

            {pending && (
              <p className="mt-3 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-3 py-2 text-sm text-[var(--mache-text)]">
                Votre demande est en cours d&apos;examen. Vous serez prévenu par e-mail.
              </p>
            )}
            {refused && (
              <p className="mt-3 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2 text-sm text-[#b01124]">
                Votre dernière demande n&apos;a pas été validée. Vous pouvez la compléter et la renvoyer.
              </p>
            )}

            <div className="mt-4">
              <Link
                href="/compte/pro"
                className="inline-block rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-black"
              >
                {pending ? "Voir ma demande" : "Ouvrir un compte professionnel"}
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-8 text-base leading-relaxed text-[var(--mache-muted)]">
          Pour acheter un article à l&apos;unité, le{" "}
          <Link href="/shop" className="font-semibold text-[var(--mache-primary)] hover:underline">
            catalogue
          </Link>{" "}
          est ouvert à tous, sans compte.
        </p>
      </main>
    );
  }

  /* ---------------------------------------------------------------- */
  /* L'annuaire : grossistes et marques.                              */
  /* ---------------------------------------------------------------- */
  const filter = FILTERS.find((entry) => entry.key === query.type)?.key ?? "tous";

  /*
    Assez large pour couvrir la marketplace entière : les fournisseurs
    sont une minorité, et les rater parce qu'on s'est arrêté aux douze
    premières boutiques viderait la page de son objet.
  */
  const result = await fetchSellers(200);

  if (!result.ok) reportOutage("trouver un fournisseur", result.reason);

  const suppliers = (result.ok ? result.data.sellers : []).filter((seller) => {
    const profile = readSellerProfile(seller.metadata);

    if (!profile || !SUPPLIER_PROFILES.includes(profile)) return false;

    return filter === "tous" || profile === filter;
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Trouver un fournisseur
      </h1>

      <p className="mt-3 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
        {access.as === "vendeur"
          ? "Vous êtes connecté comme vendeur : voici les grossistes et les marques auxquels vous pouvez demander un prix pour revendre."
          : "Votre compte professionnel est actif : voici les grossistes et les marques auxquels vous pouvez demander un prix."}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {HOW.map((item) => (
          <div key={item.title} className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
            <h2 className="text-base font-bold text-[var(--mache-text)]">{item.title}</h2>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">Grossistes et marques</h2>

          <nav aria-label="Type de fournisseur" className="flex gap-2">
            {FILTERS.map((entry) => (
              <Link
                key={entry.key}
                href={entry.key === "tous" ? "/gros" : `/gros?type=${entry.key}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  filter === entry.key
                    ? "border-[var(--mache-text)] bg-[var(--mache-text)] text-white"
                    : "border-[var(--mache-line)] bg-white text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
                }`}
              >
                {entry.label}
              </Link>
            ))}
          </nav>
        </div>

        {/*
          Dit tout de suite d'où vient cette information. « Grossiste »
          ou « Marque » affiché sans précision se lit comme une
          qualification accordée par MACHE.
        */}
        <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Ces boutiques se présentent elles-mêmes comme grossistes ou comme marques. MACHE n&apos;a pas vérifié cette
          déclaration (sauf le badge « vérifiée » quand il est affiché) : c&apos;est le vendeur qui l&apos;a renseignée.
        </p>

        {!result.ok && (
          <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
            La liste ne peut pas être affichée pour le moment. Réessayez dans quelques minutes.
          </div>
        )}

        {result.ok && suppliers.length === 0 && (
          /*
            Personne ne s'est déclaré. On le dit, et on donne les sorties
            utiles : chercher dans le catalogue, ou devenir fournisseur.
            Pas d'exemples inventés.
          */
          <div className="mt-4 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
            <p className="text-base font-semibold text-[var(--mache-text)]">
              {filter === "tous"
                ? "Aucun grossiste ni aucune marque ne s'est encore déclaré sur MACHE."
                : filter === "marque"
                  ? "Aucune marque ne s'est encore déclarée sur MACHE."
                  : "Aucun grossiste ne s'est encore déclaré sur MACHE."}
            </p>

            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
              Cela ne veut pas dire qu&apos;aucune boutique ne vend en volume : vous pouvez demander un devis à
              n&apos;importe quelle boutique, depuis la fiche d&apos;un de ses articles.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
              >
                Parcourir le catalogue
              </Link>

              <Link
                href="/sell/fournisseur"
                className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-base font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
              >
                Vous vendez en gros ? Ouvrez une boutique
              </Link>
            </div>
          </div>
        )}

        {suppliers.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {suppliers.map((seller) => {
              const minimum = readSellerMinimum(seller.metadata);
              const profile = readSellerProfile(seller.metadata) as SellerProfile;

              return (
                <div key={seller.id} className="flex flex-col rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
                  <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-[var(--mache-text)]">
                    {seller.name}
                    <span className="rounded-full bg-[var(--mache-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--mache-muted)]">
                      {profileInfo(profile).badge}
                    </span>
                    {/*
                      Sur cette page plus qu'ailleurs : une commande en
                      gros engage des sommes qu'on ne confie pas à une
                      entreprise dont on ne sait rien.
                    */}
                    {seller.isPremium && <VerifiedBadge compact />}
                  </h3>

                  {seller.description && (
                    <p className="mt-1.5 line-clamp-3 text-base leading-relaxed text-[var(--mache-muted)]">
                      {seller.description}
                    </p>
                  )}

                  {/*
                    La commande minimum, quand la boutique en a fixé
                    une. C'est l'information qui décide si l'on va plus
                    loin — la découvrir au moment de commander fait
                    perdre son temps à tout le monde.
                  */}
                  {minimum > 0 && (
                    <p className="mt-2 text-sm font-semibold text-[var(--mache-text)]">
                      Commande minimum : {formatAmount(minimum, "HTG")}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-3 pt-4 text-base">
                    <Link
                      href={`/store/${seller.handle}`}
                      className="font-semibold text-[var(--mache-primary)] hover:underline"
                    >
                      Voir ses produits et demander un devis
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
        <h2 className="text-base font-bold text-[var(--mache-text)]">Un devis n&apos;est pas une commande</h2>

        <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Demander un prix n&apos;engage à rien. Accepter une proposition ne déclenche aucun paiement : MACHE
          n&apos;encaisse pas, le règlement se convient directement avec le fournisseur.{" "}
          <Link href="/legal/terms" className="font-semibold text-[var(--mache-primary)] hover:underline">
            Conditions d&apos;utilisation
          </Link>
        </p>
      </section>
    </main>
  );
}
