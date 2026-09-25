/*
  PAGE PUBLIQUE : le suivi d'un colis, et son code de remise.

  C'EST LE SEUL ENDROIT DU SITE OÙ LE CODE S'AFFICHE

  Tout le dispositif de livraison s'organise autour de ce fait. Celui
  qui livre — le vendeur, l'agent, le point de retrait — ne le voit
  nulle part. Pour le saisir et clore la livraison, il doit l'avoir
  obtenu de l'acheteur, donc l'avoir rencontré.

  Le sens de la preuve n'est pas interchangeable : si le vendeur
  montrait un code que l'acheteur saisit, il ne prouverait rien,
  puisqu'il détiendrait déjà ce qu'il doit démontrer.

  POURQUOI CETTE PAGE EST ACCESSIBLE SANS COMPTE

  On peut acheter sur MACHÉ sans créer de compte. Sans ce lien, un tel
  acheteur n'aurait aucun moyen de lire son code — et sa livraison ne
  pourrait jamais être confirmée, donc le vendeur jamais payé. Le lien
  est remis par le vendeur à l'ouverture de l'acheminement.

  UNE ADRESSE FAUSSE ET UN COLIS INEXISTANT SE RESSEMBLENT

  Le backend répond la même chose aux deux, et cette page n'essaie pas
  d'être plus précise. Distinguer les deux dirait à qui essaie des
  adresses lesquelles existent, et il ne resterait plus qu'à chercher
  le jeton.

  LE TRANSPORTEUR EXTÉRIEUR EST UN CAS À PART

  Son livreur ne connaît pas MACHÉ et ne peut saisir aucun code. Aucun
  code n'est donc affiché — en montrer un pousserait l'acheteur à le
  réclamer à quelqu'un qui ne peut rien en faire. À la place,
  l'acheteur peut constater lui-même la réception, et c'est enregistré
  comme un constat, pas comme une preuve.
*/

import Link from "next/link";
import {
  trackDelivery,
  TRACKING_STATUS_LABELS,
  TRACKING_METHOD_LABELS,
} from "@/lib/medusa/delivery-tracking";
import { confirmReceiptAction } from "./actions";

export const dynamic = "force-dynamic";

const STEPS = ["pending", "assigned", "in_transit", "ready_for_pickup", "delivered"];

function formatDay(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function SuiviPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ jeton?: string; fait?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const token = String(query.jeton || "").trim();

  const result = await trackDelivery(id, token || null);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Suivre mon colis
      </h1>

      {!result.ok ? (
        <div className="mt-6 rounded-lg border border-[#f2c2c8] bg-[#fdeaec] p-4">
          <p className="font-semibold text-[#b01124]">Ce suivi ne s&apos;affiche pas</p>
          <p className="mt-1 text-sm leading-relaxed text-[#565959]">{result.reason}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#565959]">
            Vérifiez le lien que le vendeur vous a transmis : il contient une
            clé qui ne peut pas être devinée. Si vous avez un compte,{" "}
            <Link href="/login" className="underline">
              connectez-vous
            </Link>{" "}
            — vos livraisons y sont accessibles sans lien.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#565959]">
            Commande {result.data.orderId}
            {result.data.createdAt ? ` · ouvert le ${formatDay(result.data.createdAt)}` : ""}
          </p>

          {query.erreur && (
            <div className="mt-5 rounded-lg border border-[#f2c2c8] bg-[#fdeaec] p-4">
              <p className="text-sm leading-relaxed text-[#b01124]">{query.erreur}</p>
            </div>
          )}

          {query.fait && (
            <div className="mt-5 rounded-lg border border-[#b7dfc9] bg-[#eefaf3] p-4">
              <p className="text-sm leading-relaxed text-[#046c4e]">{query.fait}</p>
            </div>
          )}

          <section className="mt-6 rounded-lg border border-[#d5d9d9] bg-white p-5">
            <p className="text-2xs font-medium uppercase tracking-label text-[#565959]">
              Où en est votre colis
            </p>
            <p className="mt-1 text-xl font-semibold text-[var(--mache-text)]">
              {TRACKING_STATUS_LABELS[result.data.status] ?? result.data.status}
            </p>
            <p className="mt-1 text-sm text-[#565959]">
              {TRACKING_METHOD_LABELS[result.data.method] ?? result.data.method}
            </p>

            {result.data.recipientAddress && (
              <p className="mt-3 text-sm leading-relaxed text-[#565959]">
                {result.data.method === "relay" ? "À retirer à" : "Livré à"} :{" "}
                <span className="text-[var(--mache-text)]">
                  {result.data.recipientAddress}
                </span>
              </p>
            )}

            {result.data.confirmedAt && (
              <p className="mt-3 text-sm text-[#046c4e]">
                Remise confirmée le {formatDay(result.data.confirmedAt)}.
                {result.data.confirmationNote ? ` ${result.data.confirmationNote}` : ""}
              </p>
            )}
          </section>

          {/*
            LE CODE. Affiché en grand, parce qu'il va être lu à voix
            haute ou montré sur un écran de téléphone, dehors, devant
            une porte.
          */}
          {result.data.code && (
            <section className="mt-5 rounded-lg border-2 border-[var(--mache-primary)] bg-white p-5">
              <p className="text-2xs font-medium uppercase tracking-label text-[#565959]">
                Votre code de remise
              </p>
              <p className="tnum mt-2 text-4xl font-black tracking-[0.2em] text-[var(--mache-text)]">
                {result.data.code}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#565959]">
                Donnez-le <strong>seulement au moment où vous recevez le
                colis</strong>, à la personne qui vous le remet. C&apos;est en
                le saisissant qu&apos;elle prouve la livraison — et c&apos;est
                ce qui déclenche le paiement du vendeur.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#b01124]">
                Ne le communiquez jamais par téléphone ni par message avant
                d&apos;avoir le colis entre les mains.
              </p>
            </section>
          )}

          {result.data.method === "carrier" && (
            <section className="mt-5 rounded-lg border border-[#f3d9a5] bg-[#fdf6e8] p-5">
              <p className="font-semibold text-[var(--mache-text)]">
                Ce colis voyage avec un transporteur
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#565959]">
                {result.data.carrierName ? `${result.data.carrierName}. ` : ""}
                MACHÉ ne contrôle pas ce transport et ne peut pas en garantir
                les délais. Il n&apos;y a pas de code à remettre : son livreur
                ne connaît pas MACHÉ.
              </p>

              {result.data.trackingNumber && (
                <p className="tnum mt-2 text-sm text-[var(--mache-text)]">
                  Numéro de suivi : {result.data.trackingNumber}
                </p>
              )}

              {result.data.trackingUrl && (
                <p className="mt-2 text-sm">
                  <a
                    href={result.data.trackingUrl}
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                    className="underline"
                  >
                    Suivre chez le transporteur
                  </a>
                </p>
              )}

              {result.data.status !== "delivered" &&
                result.data.status !== "cancelled" && (
                  <form action={confirmReceiptAction} className="mt-4">
                    <input type="hidden" name="delivery_id" value={result.data.id} />
                    <input type="hidden" name="jeton" value={token} />

                    <label
                      htmlFor="note"
                      className="block text-sm font-semibold text-[var(--mache-text)]"
                    >
                      J&apos;ai reçu ce colis
                    </label>
                    <p className="mt-1 text-sm leading-relaxed text-[#565959]">
                      Votre constat sera enregistré comme une déclaration, pas
                      comme une preuve — c&apos;est la seule information
                      disponible pour un transport que MACHÉ ne contrôle pas.
                    </p>

                    <textarea
                      id="note"
                      name="note"
                      rows={2}
                      placeholder="Une remarque, si besoin"
                      className="mt-2 w-full rounded-[3px] border border-[#8d9096] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--mache-primary)]"
                    />

                    <button
                      type="submit"
                      className="mt-2 rounded-[3px] bg-[var(--mache-primary)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Constater la réception
                    </button>
                  </form>
                )}
            </section>
          )}

          <ol className="mt-6 space-y-2">
            {STEPS.filter((step) => {
              /* Les étapes qui n'existent pas pour cet acheminement sont tues. */
              if (step === "assigned") return result.data.method !== "seller";

              if (step === "ready_for_pickup") return result.data.method === "relay";

              return true;
            }).map((step) => {
              const reached =
                STEPS.indexOf(step) <= STEPS.indexOf(result.data.status);

              return (
                <li
                  key={step}
                  className={`flex items-center gap-3 text-sm ${
                    reached ? "text-[var(--mache-text)]" : "text-[#9a9a9a]"
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      reached ? "bg-[var(--mache-primary)]" : "bg-[#d5d9d9]"
                    }`}
                  />
                  {TRACKING_STATUS_LABELS[step] ?? step}
                </li>
              );
            })}
          </ol>

          {result.data.status === "failed" && (
            <p className="mt-4 text-sm leading-relaxed text-[#b01124]">
              La remise a échoué. Le vendeur peut la relancer ; en cas de
              doute,{" "}
              <Link href="/messages" className="underline">
                écrivez-nous
              </Link>
              .
            </p>
          )}
        </>
      )}
    </main>
  );
}
