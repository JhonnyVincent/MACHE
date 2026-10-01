/*
  PAGE : proposer ses services sur MACHE.

  Une entreprise de services (photographe, financement, graphisme…) remplit
  sa fiche. Elle est examinée par l'équipe avant d'être publique : rien
  n'apparaît sur le site sans approbation.
*/

import { Link } from "next-view-transitions";
import { pageMetadata } from "@/lib/seo";
import { SubmitButton } from "@/components/submit-button";
import { AntiSpamFields } from "@/components/anti-spam-fields";
import { PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { registerPartnerAction } from "./actions";

export const metadata = pageMetadata({
  title: "Proposer vos services sur MACHE",
  description: "Photographe, financement, graphisme, transport… présentez vos services aux vendeurs et aux acheteurs de MACHE.",
  path: "/partenaires/inscription",
});

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";
const label = "block text-sm font-semibold text-[var(--mache-text)]";
const optional = <span className="font-normal text-[var(--mache-muted)]"> (facultatif)</span>;

export default async function PartnerRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; merci?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  if (query.merci) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-14">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">Demande reçue</h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          L&apos;équipe MACHE examine votre fiche. Elle n&apos;apparaît sur le site qu&apos;une fois approuvée ; nous
          vous contacterons à l&apos;adresse indiquée.
        </p>
        <Link href="/partenaires" className="btn-primary mt-6 inline-block">
          Retour aux partenaires
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <Link href="/partenaires" className="text-sm font-semibold text-[var(--mache-muted)] hover:underline">
        ← Partenaires
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Proposer vos services
      </h1>
      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Présentez votre entreprise aux vendeurs et aux acheteurs de MACHE. Votre fiche est examinée avant d&apos;être
        publique. Votre service se traite directement avec vos clients : MACHE met en relation et ne garantit rien.
      </p>

      {query.error && (
        <p role="alert" className="mt-5 rounded-[6px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2.5 text-sm text-[#b01124]">
          {query.error}
        </p>
      )}

      <form action={registerPartnerAction} className="mt-8 space-y-4">
        <AntiSpamFields />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={label}>Nom de l&apos;entreprise</label>
            <input id="name" name="name" required maxLength={120} className={inputClass} />
          </div>
          <div>
            <label htmlFor="category" className={label}>Votre service</label>
            <select id="category" name="category" required defaultValue="" className={inputClass}>
              <option value="" disabled>Choisir…</option>
              {PARTNER_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className={label}>Présentation{optional}</label>
          <textarea id="description" name="description" rows={4} maxLength={1500} className={inputClass} />
        </div>

        <div>
          <label htmlFor="location" className={label}>Adresse ou ville{optional}</label>
          <input id="location" name="location" maxLength={160} className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="whatsapp" className={label}>WhatsApp{optional}</label>
            <input id="whatsapp" name="whatsapp" inputMode="tel" placeholder="+509 3712 3456" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={label}>Téléphone{optional}</label>
            <input id="phone" name="phone" inputMode="tel" className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="website" className={label}>Site web{optional}</label>
            <input id="website" name="website" placeholder="https://" className={inputClass} />
          </div>
          <div>
            <label htmlFor="facebook" className={label}>Page Facebook{optional}</label>
            <input id="facebook" name="facebook" placeholder="https://facebook.com/…" className={inputClass} />
          </div>
          <div>
            <label htmlFor="instagram" className={label}>Instagram{optional}</label>
            <input id="instagram" name="instagram" placeholder="https://instagram.com/…" className={inputClass} />
          </div>
          <div>
            <label htmlFor="logo" className={label}>Adresse de votre logo{optional}</label>
            <input id="logo" name="logo" placeholder="https://…/logo.png" className={inputClass} />
          </div>
        </div>

        <div className="rounded-[10px] border border-[var(--mache-line)] bg-[#f8f8f8] p-4">
          <p className="text-sm font-bold text-[var(--mache-text)]">Pour que l&apos;équipe vous réponde (non publié)</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact_name" className={label}>Votre nom</label>
              <input id="contact_name" name="contact_name" maxLength={120} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact_email" className={label}>Votre e-mail</label>
              <input id="contact_email" name="contact_email" type="email" required maxLength={254} className={inputClass} />
            </div>
          </div>
        </div>

        <SubmitButton className="btn-primary" pendingLabel="Envoi…">
          Envoyer ma demande
        </SubmitButton>
      </form>
    </main>
  );
}
