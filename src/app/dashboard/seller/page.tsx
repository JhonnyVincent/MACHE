/*
  PAGE : entrée de l'espace vendeur

  L'espace vendeur de MACHÉ n'est plus une trentaine de pages Next : c'est
  le panneau vendeur de Mercur, servi par le backend commerce.

  Pourquoi ce choix

  Les trente-cinq pages précédentes lisaient les tables commerce de
  Supabase. Depuis que le catalogue, le stock et les commandes vivent dans
  Medusa, elles montraient à chaque vendeur des chiffres qui ne
  correspondaient plus à rien — un stock qui n'était plus le sien, un
  chiffre d'affaires figé. Les réécrire aurait voulu dire réimplémenter,
  écran par écran, un produit déjà maintenu en amont : produits,
  variantes, inventaire, commandes, commissions, versements.

  Cette page n'est donc pas une page d'attente : c'est la porte d'entrée,
  et elle dit où aller.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { reportOutage } from "@/lib/medusa/outage";
import { supabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const CAPABILITIES = [
  "Produits, variantes, photos et prix",
  "Stock et inventaire",
  "Commandes de votre boutique et expéditions",
  "Commissions retenues par MACHÉ",
  "Versements et compte de paiement",
  "Avis reçus et réponses",
];

export default async function SellerEntryPage() {
  const backendUrl = medusaBackendUrl();
  const vendorUrl = backendUrl ? `${backendUrl}/seller` : "";

  /*
    On vérifie seulement qu'une session existe, sans exiger de rôle : le
    panneau vendeur a sa propre authentification, et refuser ici quelqu'un
    qui a un compte vendeur Mercur mais pas de rôle Supabase serait un
    verrou sans objet.
  */
  let signedIn = false;

  if (supabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    } catch {
      /* Session illisible : la page reste consultable. */
    }
  }

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
        Espace vendeur
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Votre boutique se gère depuis le panneau vendeur MACHÉ. Tout y est :
      </p>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {CAPABILITIES.map((item) => (
          <li key={item} className="flex gap-2 text-base text-[var(--mache-text)]">
            <span aria-hidden="true" className="text-[var(--mache-success)]">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <a
          href={vendorUrl}
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Ouvrir mon panneau vendeur
        </a>

        {/*
          Ce lien dit « en savoir plus » et non « devenir vendeur » : la
          page /sell renvoie ici, et deux boutons qui se renvoient l'un à
          l'autre font tourner en rond quelqu'un qui cherche simplement où
          s'inscrire. L'inscription se fait dans le panneau vendeur.
        */}
        {!signedIn && (
          <Link
            href="/sell"
            className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
          >
            Vendre sur MACHÉ : ce qu&apos;il faut savoir
          </Link>
        )}
      </div>

      <div className="mt-8 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Un compte vendeur distinct
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
          Le panneau vendeur a sa propre inscription. Si vous vendiez déjà sur
          l&apos;ancienne version de MACHÉ, créez-y votre boutique : le
          catalogue a changé de moteur, et les anciennes fiches produit ne
          sont pas reprises automatiquement. Écrivez à l&apos;équipe MACHÉ si
          vous avez besoin d&apos;aide pour les transférer.
        </p>
      </div>

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
      </div>

      <p className="mt-6 text-sm text-[var(--mache-muted)]">
        Vous cherchiez plutôt vos achats ?{" "}
        <Link href="/dashboard/buyer" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Espace client
        </Link>
      </p>
    </main>
  );
}
