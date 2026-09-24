/*
  Bandeau défilant de l'accueil.

  Ce qu'il annonçait

  « −30 % Mode caribéenne », « Livraison offerte selon conditions »,
  « Stripe, PayPal, local methods, COD ». Aucune de ces trois phrases
  n'était vraie : il n'y a pas de promotion en cours, pas de livraison
  offerte, et aucun prestataire de paiement n'est branché. Un bandeau
  qui défile est lu comme une annonce commerciale, pas comme une
  intention — il n'a pas droit au futur.

  Ce qu'il annonce

  Uniquement des faits vérifiables sur le site aujourd'hui : le taux de
  commission, la gratuité de l'inscription, la carte, le devis, la
  vérification d'agent.

  Il n'est pour l'instant affiché nulle part : il n'est pas monté dans
  l'accueil. Il est corrigé quand même, pour qu'on ne le rebranche pas
  un jour avec ses fausses promotions.
*/

import { COMMISSION_RATE, COMMISSION_RATE_REDUCED } from "@/lib/tarifs";

const items = [
  { badge: "GRATUIT", text: "Ouvrir une boutique ne coûte rien" },
  {
    badge: "COMMISSION",
    text:
      COMMISSION_RATE === null
        ? "Commission sur les ventes"
        : `${COMMISSION_RATE} % sur les ventes, ${COMMISSION_RATE_REDUCED} % pour les fournisseurs et les marques`,
  },
  { badge: "HAÏTI", text: "Les dix départements et ce qu'on y produit" },
  { badge: "GROS", text: "Achat en quantité : demande de devis au vendeur" },
  { badge: "AGENTS", text: "Le code d'un agent MACHÉ se vérifie en ligne" },
];

export function HomeTicker() {
  const row = [...items, ...items];

  return (
    <div className="overflow-hidden bg-[var(--mache-dark-2)]">
      <div className="container-page overflow-hidden">
        <div className="flex min-h-[34px] items-center">
          <div className="mache-ticker flex min-w-max gap-10">
            {row.map((item, index) => (
              <div key={`${item.badge}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                <span className="rounded-[4px] bg-[var(--mache-primary)] px-2 py-0.5 text-2xs font-black text-white">
                  {item.badge}
                </span>
                <span className="text-xs text-white/60">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
