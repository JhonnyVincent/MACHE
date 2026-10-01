/*
  PAGE : rejoindre MACHE comme vendeur, grossiste ou marque.

  Une liste de départ : les vendeurs et grossistes laissent leurs
  coordonnées avant l'ouverture. Rien n'est promis de plus que ce qui
  est vrai — pas de date d'ouverture, pas de tarif : l'équipe recontacte
  chacun pour ouvrir sa boutique.
*/

import { Link } from "next-view-transitions";
import { pageMetadata } from "@/lib/seo";
import { SubmitButton } from "@/components/submit-button";
import { AntiSpamFields } from "@/components/anti-spam-fields";
import { preRegisterAction } from "./actions";

export const metadata = pageMetadata({
  title: "Rejoindre MACHE : vendeurs et grossistes",
  description:
    "Vendeur, grossiste ou marque : laissez vos coordonnées pour faire partie des premiers à vendre sur MACHE, la marketplace haïtienne.",
  path: "/rejoindre",
});

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

const label = "block text-sm font-semibold text-[var(--mache-text)]";

export default async function RejoindrePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; merci?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  if (query.merci) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-14">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">Merci, c&apos;est noté.</h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Vous faites partie de la liste de départ. L&apos;équipe MACHE vous contactera pour ouvrir votre boutique.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Rejoindre MACHE
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Vous vendez, vous êtes grossiste ou vous avez une marque ? Laissez vos coordonnées : vous serez parmi les
        premiers contactés pour ouvrir votre boutique.
      </p>

      {query.error && (
        <p role="alert" className="mt-5 rounded-[6px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2.5 text-sm text-[#b01124]">
          {query.error}
        </p>
      )}

      <form action={preRegisterAction} className="mt-8 space-y-4">
        <AntiSpamFields />

        <div>
          <label htmlFor="kind" className={label}>Vous êtes</label>
          <select id="kind" name="kind" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choisir…</option>
            <option value="vendeur">Vendeur — je vends mes produits</option>
            <option value="grossiste">Grossiste — je vends par quantité</option>
            <option value="marque">Marque — je crée un produit et le confie à des revendeurs</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={label}>Votre nom</label>
            <input id="name" name="name" required maxLength={200} className={inputClass} />
          </div>
          <div>
            <label htmlFor="shop" className={label}>
              Nom de la boutique <span className="font-normal text-[var(--mache-muted)]">(facultatif)</span>
            </label>
            <input id="shop" name="shop" maxLength={200} className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={label}>Adresse e-mail</label>
            <input id="email" name="email" type="email" required maxLength={254} className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={label}>WhatsApp / téléphone</label>
            <input id="phone" name="phone" required maxLength={60} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="city" className={label}>Ville et pays</label>
          <input id="city" name="city" maxLength={120} placeholder="Ex. Jacmel, Haïti" className={inputClass} />
        </div>

        <div>
          <label htmlFor="products" className={label}>Qu&apos;est-ce que vous vendez ?</label>
          <textarea id="products" name="products" required rows={4} maxLength={1500} className={inputClass} />
        </div>

        <div>
          <label htmlFor="minimum" className={label}>
            Quantité minimale <span className="font-normal text-[var(--mache-muted)]">(grossistes seulement)</span>
          </label>
          <input id="minimum" name="minimum" maxLength={200} placeholder="Ex. 50 pièces" className={inputClass} />
        </div>

        <SubmitButton className="btn-primary" pendingLabel="Envoi…">Rejoindre la liste</SubmitButton>
      </form>
    </main>
  );
}
