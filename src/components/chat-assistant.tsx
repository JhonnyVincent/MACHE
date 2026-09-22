"use client";

/*
  AIDE RAPIDE

  Ce que ce bouton était

  Il s'appelait « Assistant IA Mache », affichait « En ligne », et
  répondait à quatre mots-clés avec quatre phrases écrites en dur.

  Il n'y avait aucune IA — quatre `if` sur le texte saisi. « En ligne »
  laissait croire à un service disponible, voire à quelqu'un au bout.

  Et ses réponses étaient fausses. À qui demandait comment payer, il
  répondait : « Le site est prêt pour Stripe en phase 1, PayPal en phase
  2, méthodes locales en phase 3. » Il n'y a ni Stripe ni PayPal, et un
  client en concluait qu'il pourrait payer par carte.

  Ce que c'est maintenant

  Une aide rapide, nommée pour ce qu'elle est : des réponses courtes aux
  questions fréquentes, et un lien vers la page qui répond en entier.
  Rien n'est généré, rien n'est deviné — et quand la question n'est pas
  reconnue, il le dit au lieu de répondre quand même.

  Le jour où une vraie assistance conversationnelle sera branchée, elle
  prendra cette place et pourra s'appeler ainsi.
*/

import { useState } from "react";
import Link from "next/link";

type Reponse = {
  /* Ce que le visiteur peut cliquer. */
  question: string;
  /* Ce qu'on lui répond, vrai aujourd'hui. */
  reponse: string;
  /* Où lire la réponse complète. */
  lien?: { href: string; label: string };
};

const REPONSES: Reponse[] = [
  {
    question: "Comment je paie ?",
    reponse:
      "À la livraison, en main propre, après avoir vérifié le colis. Aucune donnée bancaire ne vous est demandée. Le paiement par carte n'est pas proposé aujourd'hui.",
    lien: { href: "/faq", label: "Questions fréquentes" },
  },
  {
    question: "Comment vendre sur MACHÉ ?",
    reponse:
      "Vous ouvrez votre boutique depuis le site, en quelques minutes. MACHÉ la relit avant qu'elle apparaisse dans le catalogue ; vous pouvez préparer vos produits pendant ce temps.",
    lien: { href: "/dashboard/seller/inscription", label: "Ouvrir ma boutique" },
  },
  {
    question: "Un livreur se présente, comment le vérifier ?",
    reponse:
      "Il porte un code. Saisissez-le avant de lui remettre un colis ou de l'argent. Si la vérification ne répond pas, ne remettez rien.",
    lien: { href: "/verify-agent", label: "Vérifier un agent" },
  },
  {
    question: "J'achète chez plusieurs boutiques ?",
    reponse:
      "Votre panier devient plusieurs commandes, une par boutique, chacune avec sa livraison. Certaines boutiques demandent un montant minimum : le panier vous le dit avant de commander.",
    lien: { href: "/legal/terms", label: "Comment MACHÉ fonctionne" },
  },
  {
    question: "Puis-je retourner un article ?",
    reponse:
      "Adressez-vous d'abord au vendeur, c'est lui qui a préparé et expédié. Si vous n'obtenez pas de réponse, écrivez à MACHÉ.",
    lien: { href: "/legal/returns", label: "Retours et remboursements" },
  },
  {
    question: "Peut-on exporter depuis Haïti ?",
    reponse:
      "Pas encore. Les vendeurs livrent en Haïti. Les formalités douanières et le transport international ne sont pas pris en charge par la plateforme.",
    lien: { href: "/export", label: "Exporter depuis Haïti" },
  },
];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [choisie, setChoisie] = useState<Reponse | null>(null);

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[var(--mache-dark)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-medium)] transition hover:-translate-y-0.5"
      >
        {open ? "Fermer" : "Aide rapide"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex w-[min(360px,calc(100%-24px))] flex-col overflow-hidden rounded-[14px] border border-[var(--mache-line)] bg-white shadow-[var(--shadow-medium)]">
          <div className="flex items-center justify-between bg-[var(--mache-dark)] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Aide rapide</p>
              {/*
                Ce que c'est, dit tout de suite. L'ancien encart
                affichait « En ligne », ce qui laissait croire à
                quelqu'un au bout du fil.
              */}
              <p className="text-xs text-white/60">
                Réponses aux questions fréquentes
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer l'aide"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-sm text-white/70"
            >
              ×
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-3">
            {choisie ? (
              <div>
                <p className="text-base font-bold text-[var(--mache-text)]">
                  {choisie.question}
                </p>
                <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
                  {choisie.reponse}
                </p>

                {choisie.lien && (
                  <Link
                    href={choisie.lien.href}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-block rounded-[6px] bg-[var(--mache-primary)] px-4 py-2 text-base font-bold text-white"
                  >
                    {choisie.lien.label}
                  </Link>
                )}

                <button
                  onClick={() => setChoisie(null)}
                  className="mt-3 block text-sm font-semibold text-[var(--mache-muted)] hover:underline"
                >
                  ← Autres questions
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {REPONSES.map((entry) => (
                  <button
                    key={entry.question}
                    onClick={() => setChoisie(entry)}
                    className="block w-full rounded-[8px] border border-[var(--mache-line)] px-3 py-2 text-left text-base text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
                  >
                    {entry.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/*
            Aucun champ de saisie : une question libre appellerait une
            réponse qu'on ne sait pas donner. On envoie vers quelqu'un
            qui saura.
          */}
          <div className="border-t border-[var(--mache-line)] px-3 py-3">
            <p className="text-sm leading-relaxed text-[var(--mache-muted)]">
              Votre question n&apos;est pas là ?{" "}
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Écrivez-nous
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}
