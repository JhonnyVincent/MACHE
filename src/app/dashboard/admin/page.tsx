/*
  PAGE : vue d'ensemble de l'administration.

  Ce qu'elle montre, et ce qu'elle ne refait pas

  Les chiffres viennent de Medusa, lus à chaque affichage. Rien n'est
  estimé : une lecture qui échoue affiche un tiret, pas un zéro —
  « aucune boutique » et « je n'ai pas pu compter » sont deux choses
  différentes, et la seconde ne doit pas se déguiser en première.

  Pour AGIR — approuver une boutique, ajuster une commission, traiter un
  versement, modérer un avis — cette page mène au panneau
  d'administration servi par le backend. Il est plus complet que ce que
  ce site saurait refaire, et il est maintenu en amont.

  C'est la même décision que pour l'espace vendeur, et elle a la même
  justification : les pages écrites ici pour redire ce qu'un produit
  maintenu ailleurs dit déjà finissaient par afficher des chiffres qui
  ne correspondaient plus à rien.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser, fetchMarketplaceState } from "@/lib/medusa/admin";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

/* Ce que le panneau du backend sait faire, pour ne pas le chercher. */
const PANEL_CAPABILITIES = [
  "Approuver une boutique, la suspendre, la vérifier",
  "Commissions et taux par vendeur ou par catégorie",
  "Versements aux vendeurs et comptes de paiement",
  "Commandes, groupes de commandes, retours et litiges",
  "Avis : modération et publication",
  "Catalogue : produits, catégories, promotions",
];

export default async function AdminHomePage() {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const state = await fetchMarketplaceState();

  if (!state.ok) reportOutage("administration", state.reason);

  const backendUrl = medusaBackendUrl();
  const panelUrl = backendUrl ? `${backendUrl}/dashboard` : "";

  const figures = [
    {
      label: "Boutiques",
      value: state.ok ? state.data.sellers : null,
      hint: "Inscrites sur la marketplace",
    },
    {
      label: "En attente d'approbation",
      value: state.ok ? state.data.pending : null,
      hint: "Ouvertes, pas encore validées",
    },
    {
      label: "Commandes",
      value: state.ok ? state.data.orders : null,
      hint: "Depuis l'ouverture",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">
          Vue d&apos;ensemble
        </h1>
        <p className="mt-1 text-base text-[#565959]">
          L&apos;état de la marketplace, lu dans le backend commerce.
        </p>
      </div>

      {!state.ok && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          Les chiffres ne peuvent pas être lus pour le moment. Rien
          n&apos;est perdu : réessayez dans quelques minutes.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {figures.map((figure) => (
          <div
            key={figure.label}
            className="rounded-[8px] border border-[#d5d9d9] bg-white p-4"
          >
            <p className="text-sm font-medium text-[#565959]">{figure.label}</p>

            <p className="mt-1 text-3xl font-bold text-[#0f1111]">
              {/*
                Un tiret quand la lecture a échoué. Zéro serait une
                affirmation — et elle serait fausse.
              */}
              {figure.value === null ? "—" : figure.value}
            </p>

            <p className="mt-1 text-xs text-[#565959]">{figure.hint}</p>
          </div>
        ))}
      </div>

      {state.ok && state.data.pending > 0 && (
        <div className="rounded-[8px] border border-[#f5d9a8] bg-[#fff8ed] px-4 py-3">
          <p className="text-base font-bold text-[#8a5a00]">
            {state.data.pending} boutique{state.data.pending > 1 ? "s" : ""} attend
            {state.data.pending > 1 ? "ent" : ""} votre décision
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#8a5a00]">
            Tant qu&apos;une boutique n&apos;est pas approuvée, ses produits
            n&apos;apparaissent pas dans le catalogue. Son propriétaire, lui,
            attend.
          </p>
        </div>
      )}

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
        <h2 className="text-lg font-bold text-[#0f1111]">
          Panneau d&apos;administration
        </h2>

        <p className="mt-1.5 text-base leading-relaxed text-[#565959]">
          Les décisions se prennent dans le panneau servi par le backend
          commerce. Il n&apos;est pas dupliqué ici : ce serait réécrire, écran
          par écran, un outil déjà maintenu en amont — et deux versions d&apos;un
          même écran finissent toujours par dire deux choses différentes.
        </p>

        <ul className="mt-3 grid gap-1.5 text-base text-[#565959] sm:grid-cols-2">
          {PANEL_CAPABILITIES.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-[#0f1111]">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {panelUrl ? (
          <a
            href={panelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-[6px] bg-[#0f1111] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-black"
          >
            Ouvrir le panneau
          </a>
        ) : (
          <p className="mt-4 text-sm text-[#565959]">
            L&apos;adresse du backend commerce n&apos;est pas renseignée sur ce
            déploiement : le panneau ne peut pas être ouvert d&apos;ici.
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-[#565959]">
          Il demande ses propres identifiants — les mêmes que ceux de cette
          page.
        </p>
      </div>
    </div>
  );
}
