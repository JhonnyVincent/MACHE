/*
  PAGE : mon compte professionnel.

  Pour qui

  Un hôtel, une école, un restaurant, une entreprise, une association :
  quelqu'un qui achète en quantité sans vendre sur MACHE. Il demande ici
  un compte professionnel ; MACHE le valide. Une fois accordé, il voit les
  grossistes et les marques (« Trouver un fournisseur ») et peut leur
  demander un devis.

  Les VENDEURS n'ont pas besoin de cette page : ils ont déjà accès.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { AntiSpamFields } from "@/components/anti-spam-fields";
import { getCustomer, getProInfo } from "@/lib/medusa/customer";
import { getTradeAccess } from "@/lib/trade-access";
import { requestProAction } from "./actions";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Compte professionnel",
  description: "Hôtels, écoles, restaurants, entreprises : demandez un compte professionnel pour acheter en quantité.",
  path: "/compte/pro",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

const labelClass = "text-sm font-semibold text-[var(--mache-text)]";

const TYPES: Array<[string, string]> = [
  ["hotel", "Hôtel"],
  ["restaurant", "Restaurant"],
  ["ecole", "École"],
  ["entreprise", "Entreprise"],
  ["ong", "ONG / association"],
  ["commerce", "Commerce"],
  ["autre", "Autre"],
];

export default async function ProAccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; envoye?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const customer = await getCustomer();
  const access = await getTradeAccess();

  /*
    Un vendeur connecté a déjà accès aux fournisseurs : on le lui dit,
    plutôt que de le renvoyer vers une connexion client dont il n'a pas
    besoin.
  */
  if (!customer && access.as === "vendeur") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">Compte professionnel</h1>
        <div className="mt-5 rounded-[6px] border border-[var(--mache-success-line)] bg-[var(--mache-success-soft)] px-4 py-3 text-base text-[var(--mache-success)]">
          Vous êtes connecté comme vendeur : vous avez déjà accès aux grossistes et aux marques, et vous pouvez leur
          demander des devis. Un compte professionnel est pour ceux qui achètent sans vendre.
        </div>
        <Link
          href="/gros"
          className="mt-5 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Trouver un fournisseur
        </Link>
      </main>
    );
  }

  /* Un statut professionnel s'attache à un compte client. */
  if (!customer) redirect("/compte/connexion?next=/compte/pro");

  const pro = await getProInfo();

  const status = pro?.status ?? "none";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">Compte professionnel</h1>

      <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
        Pour acheter en quantité (pour un hôtel, une école, un restaurant, une entreprise, une association) sans
        vendre sur MACHE. Une fois validé, vous voyez les grossistes et les marques, et vous pouvez leur demander un
        devis.
      </p>

      {access.as === "vendeur" && (
        <div className="mt-5 rounded-[6px] border border-[var(--mache-success-line)] bg-[var(--mache-success-soft)] px-4 py-3 text-base text-[var(--mache-success)]">
          Vous êtes connecté comme vendeur : vous avez déjà accès aux fournisseurs, sans compte professionnel.
        </div>
      )}

      {query.error && (
        <div className="mt-5 rounded-[6px] border border-[var(--mache-danger-line)] bg-[var(--mache-danger-soft)] px-4 py-3 text-base text-[var(--mache-danger-text)]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {query.envoye && (
        <div className="mt-5 rounded-[6px] border border-[var(--mache-success-line)] bg-[var(--mache-success-soft)] px-4 py-3 text-base text-[var(--mache-success)]">
          Votre demande est envoyée. MACHE l&apos;examine et vous écrit par e-mail.
        </div>
      )}

      {status === "approved" && (
        <div className="mt-6 rounded-[8px] border border-[var(--mache-success-line)] bg-[var(--mache-success-soft)] p-5">
          <h2 className="text-lg font-bold text-[var(--mache-success)]">Votre compte professionnel est actif</h2>
          <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
            Vous voyez les grossistes et les marques, et vous pouvez demander un devis depuis la fiche d&apos;un
            produit.
          </p>
          <Link
            href="/gros"
            className="mt-4 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Trouver un fournisseur
          </Link>
        </div>
      )}

      {status === "pending" && (
        <div className="mt-6 rounded-[8px] border border-[var(--mache-warn-line)] bg-[var(--mache-warn-soft)] p-5">
          <h2 className="text-lg font-bold text-[var(--mache-text)]">Demande en cours d&apos;examen</h2>
          <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
            {pro?.organisation ? `${pro.organisation}${pro.city ? `, ${pro.city}` : ""} : ` : ""}
            MACHE examine votre demande et vous écrit par e-mail. Vous pouvez la corriger ci-dessous : elle remplace la
            précédente.
          </p>
        </div>
      )}

      {status === "refused" && (
        <div className="mt-6 rounded-[8px] border border-[var(--mache-danger-line)] bg-[var(--mache-danger-soft)] p-5">
          <h2 className="text-lg font-bold text-[var(--mache-danger-text)]">Demande non validée</h2>
          <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
            Le motif vous a été envoyé par e-mail. Vous pouvez compléter votre demande et la renvoyer.
          </p>
        </div>
      )}

      {status !== "approved" && access.as !== "vendeur" && (
        <form action={requestProAction} className="mt-6 space-y-4">
          <AntiSpamFields />

          <div>
            <label htmlFor="organisation" className={labelClass}>Nom de l&apos;organisation *</label>
            <input
              id="organisation"
              name="organisation"
              required
              maxLength={120}
              defaultValue={pro?.organisation ?? ""}
              autoComplete="organization"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className={labelClass}>Type d&apos;organisation *</label>
              <select id="type" name="type" required defaultValue={pro?.type ?? ""} className={inputClass}>
                <option value="" disabled>Choisir…</option>
                {TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className={labelClass}>Ville *</label>
              <input
                id="city"
                name="city"
                required
                maxLength={80}
                defaultValue={pro?.city ?? ""}
                autoComplete="address-level2"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Téléphone *</label>
            <input
              id="phone"
              name="phone"
              required
              inputMode="tel"
              defaultValue={pro?.phone ?? customer.phone ?? ""}
              autoComplete="tel"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[var(--mache-muted)]">MACHE peut vous appeler pour valider la demande.</p>
          </div>

          <div>
            <label htmlFor="note" className={labelClass}>
              Ce que vous cherchez à acheter <span className="font-normal text-[var(--mache-muted)]">(facultatif)</span>
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={500}
              placeholder="Ex. linge de maison pour un hôtel de 20 chambres"
              className={inputClass}
            />
          </div>

          <SubmitButton
            pendingLabel="Envoi…"
            className="rounded-[6px] bg-[var(--mache-primary)] px-6 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            {status === "none" ? "Envoyer ma demande" : "Renvoyer ma demande"}
          </SubmitButton>
        </form>
      )}
    </main>
  );
}
