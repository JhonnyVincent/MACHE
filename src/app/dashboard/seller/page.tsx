/*
  PAGE : entrée de l'espace vendeur

  L'espace vendeur de MACHÉ n'est plus une trentaine de pages Next : c'est
  le panneau vendeur de Mercur, servi par le backend commerce.

  Pourquoi ce choix

  Les trente-cinq pages précédentes lisaient les tables commerce de
  l'ancien socle. Depuis que le catalogue, le stock et les commandes vivent dans
  Medusa, elles montraient à chaque vendeur des chiffres qui ne
  correspondaient plus à rien — un stock qui n'était plus le sien, un
  chiffre d'affaires figé. Les réécrire aurait voulu dire réimplémenter,
  écran par écran, un produit déjà maintenu en amont : produits,
  variantes, inventaire, commandes, commissions, versements.

  Cette page n'est donc pas une page d'attente : c'est la porte d'entrée,
  et elle dit où aller.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { vendorLogoutAction } from "./connexion/actions";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

const CAPABILITIES = [
  "Produits, variantes, photos et prix",
  "Stock et inventaire",
  "Commandes de votre boutique et expéditions",
  "Commissions retenues par MACHÉ",
  "Versements et compte de paiement",
  "Avis reçus et réponses",
];

export default async function SellerEntryPage({
  searchParams,
}: {
  searchParams?: Promise<{ bienvenue?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const backendUrl = medusaBackendUrl();
  const vendorUrl = backendUrl ? `${backendUrl}/seller` : "";

  /*
    On vérifie seulement qu'une session existe, sans exiger de rôle : le
    panneau vendeur a sa propre authentification, et refuser ici quelqu'un
    qui a un compte vendeur Mercur mais pas de rôle dans l'ancien socle serait un
    verrou sans objet.
  */
  /*
    La boutique du vendeur connecté, s'il l'est. C'est ce qui permet de
    dire où il en est — notamment qu'une boutique fraîchement ouverte
    attend d'être approuvée.
  */
  const vendor = await getVendorSeller();

  /*
    Un vendeur n'est pas l'exploitant du site : lui montrer le nom d'une
    variable d'environnement, c'est lui demander de comprendre un
    problème qu'il ne peut pas corriger. La cause va au journal, où la
    trouvera celui qui déploie.
  */
  if (!backendUrl) {
    reportOutage(
      "espace vendeur",
      "adresse du backend commerce absente (NEXT_PUBLIC_MEDUSA_BACKEND_URL)"
    );

    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-14">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Espace vendeur momentanément indisponible
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Le panneau vendeur ne peut pas être joint pour le moment.
          Réessayez dans quelques minutes. Si cela persiste, écrivez à
          l&apos;équipe MACHÉ.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
        >
          Contacter MACHÉ
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        {vendor ? vendor.name : "Espace vendeur"}
      </h1>

      {/*
        Quelle boutique, et à quelle adresse. Un vendeur connecté voyait
        « Espace vendeur » : rien ne lui disait dans quelle boutique il
        se trouvait, ce qui compte dès qu'on en gère deux.
      */}
      {vendor && (
        <p className="mt-1 text-md text-[var(--mache-muted)]">
          Espace vendeur ·{" "}
          <Link
            href={`/store/${vendor.handle}`}
            className="text-[var(--mache-primary)] hover:underline"
          >
            /store/{vendor.handle}
          </Link>
        </p>
      )}

      {/*
        Cette phrase disait « Votre boutique se gère depuis… » à tout le
        monde, y compris à quelqu'un qui n'a pas de boutique et que la
        page ne reconnaît pas. Elle lui affirmait qu'il en possédait
        une, puis lui proposait d'en créer une juste en dessous.
      */}
      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        {vendor ? (
          <>Votre boutique se gère depuis le panneau vendeur MACHÉ. Tout y est :</>
        ) : (
          <>
            Vous n&apos;êtes pas connecté. Une boutique sur MACHÉ se gère
            depuis le panneau vendeur, qui réunit :
          </>
        )}
      </p>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {CAPABILITIES.map((item) => (
          <li key={item} className="flex gap-2 text-base text-[var(--mache-text)]">
            <span aria-hidden="true" className="text-[var(--mache-success)]">✓</span>
            {item}
          </li>
        ))}
      </ul>

      {query.bienvenue && vendor && (
        <div className="mt-5 rounded-[10px] border border-[#b7dfc9] bg-[#f4fbf7] p-4">
          <p className="text-md font-bold text-[#046c4e]">
            Votre boutique « {vendor.name} » est ouverte.
          </p>
          <p className="mt-1 text-base leading-relaxed text-[var(--mache-muted)]">
            Ajoutez vos produits dès maintenant depuis le panneau
            vendeur, et composez votre vitrine. Elle apparaîtra dans le
            catalogue MACHÉ une fois approuvée.
          </p>
        </div>
      )}

      {/*
        L'état réel de la boutique, et non un état supposé. Un vendeur
        qui ne voit pas sa boutique dans le catalogue doit savoir si
        c'est une attente ou un refus.
      */}
      {vendor && vendor.status !== "active" && (
        <div className="mt-5 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
          <p className="text-md font-bold text-[var(--mache-text)]">
            {vendor.status === "rejected"
              ? "Votre boutique n'a pas été retenue"
              : "Votre boutique est en attente d'approbation"}
          </p>
          <p className="mt-1 text-base leading-relaxed text-[var(--mache-muted)]">
            {vendor.status === "rejected" ? (
              <>
                Elle n&apos;apparaîtra pas dans le catalogue. Écrivez à
                l&apos;équipe MACHÉ pour en connaître la raison.
              </>
            ) : (
              <>
                Vous pouvez préparer vos produits et votre vitrine dès
                maintenant. Elle n&apos;est pas encore visible dans le
                catalogue, et le sera dès que MACHÉ l&apos;aura relue.
              </>
            )}
          </p>
        </div>
      )}

      {/*
        Deux boutons qui commençaient tous les deux par « Ouvrir » et
        faisaient l'inverse l'un de l'autre : l'un entrait dans une
        boutique existante, l'autre en créait une. Le premier était mis
        en avant même pour quelqu'un sans boutique, à qui le panneau
        n'aurait fait que redemander des identifiants qu'il n'a pas.

        L'action principale dépend donc de l'état, et les verbes ne se
        ressemblent plus : on ENTRE, ou on CRÉE.
      */}
      <div className="mt-6 flex flex-wrap gap-2.5">
        {vendor ? (
          <a
            href={vendorUrl}
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Ouvrir mon panneau vendeur
          </a>
        ) : (
          <>
            <Link
              href="/dashboard/seller/connexion"
              className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              J&apos;ai déjà une boutique : me connecter
            </Link>

            <Link
              href="/dashboard/seller/inscription"
              className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
            >
              Créer ma boutique
            </Link>
          </>
        )}
      </div>

      {/*
        Cet encart disait d'aller créer sa boutique dans le panneau, ce
        qui n'a plus de sens depuis qu'on l'ouvre depuis MACHÉ. Il dit
        maintenant ce qui reste vrai : deux connexions, parce que ce
        sont deux applications.
      */}
      {vendor && (
      <div className="mt-8 rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Deux connexions, et c&apos;est normal
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
          Le panneau vendeur est une application distincte : il vous
          demandera vos identifiants une première fois. Ce sont les mêmes
          que ceux de cette page. Vous pouvez y passer l&apos;interface en
          français depuis votre profil.
        </p>
        {vendor && (
          <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
            Si vous vendiez sur l&apos;ancienne version de MACHÉ, vos
            anciennes fiches produit ne sont pas reprises
            automatiquement — le catalogue a changé de moteur. Écrivez à
            l&apos;équipe pour un transfert.
          </p>
        )}
      </div>
      )}

      {/*
        Ces pages exigent une session : les proposer à quelqu'un qui n'en
        a pas l'enverrait vers un écran de connexion sans qu'il
        comprenne pourquoi.
      */}
      {vendor && (
      <div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--mache-line)] pt-4 text-sm">
        <Link
          href="/dashboard/seller/vitrine"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Personnaliser ma vitrine
        </Link>
        <Link
          href="/dashboard/seller/profil"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Le profil de ma boutique
        </Link>
        {/*
          Les contrats n'existent pas dans le panneau Mercur : c'est une
          fonction propre à MACHÉ, comme les devis et les livraisons.
        */}
        <Link
          href="/dashboard/seller/contrats"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Contrats de MACHÉ
        </Link>
        <Link
          href="/dashboard/seller/livraisons"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Mes livraisons
        </Link>
      </div>
      )}

      {/*
        Se déconnecter. Un vendeur connecté n'avait aucun moyen de
        sortir depuis cette page : il fallait effacer ses cookies.
      */}
      {vendor && (
        <form action={vendorLogoutAction} className="mt-6">
          <button
            type="submit"
            className="text-sm font-semibold text-[var(--mache-muted)] hover:text-[var(--mache-danger)] hover:underline"
          >
            Se déconnecter de {vendor.name}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-[var(--mache-muted)]">
        Vous cherchiez plutôt vos achats ?{" "}
        <Link href="/dashboard/buyer" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Espace client
        </Link>
      </p>
    </main>
  );
}
