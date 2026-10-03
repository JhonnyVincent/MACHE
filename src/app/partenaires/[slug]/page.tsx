/*
  PAGE : le profil d'un partenaire de services.

  Un partenaire (financement, photographie…) se présente ici : nom,
  catégorie, description, adresse, et ses liens pour le joindre. Chaque
  bloc n'apparaît que s'il est renseigné dans `src/lib/partners.ts`, avec
  l'accord du partenaire.

  La page dit toujours que le service est fourni par le partenaire, pas
  par MACHE : MACHE met en relation, et ne garantit rien.
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "next-view-transitions";
import { PARTNERS, partnerBySlug } from "@/lib/partners";
import { fetchDbPartner } from "@/lib/medusa/partners-db";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/seller-whatsapp";

/* Les partenaires enregistrés dans MACHE s'ajoutent sans redéploiement. */
export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return PARTNERS.filter((partner) => partner.slug).map((partner) => ({ slug: String(partner.slug) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const partner = partnerBySlug(slug) ?? (await fetchDbPartner(slug));

  if (!partner) return {};

  return pageMetadata({
    title: `${partner.name}, partenaire de MACHE`,
    description: partner.description || partner.does,
    path: `/partenaires/${partner.slug}`,
  });
}

const button =
  "inline-flex items-center rounded-[6px] border border-[var(--mache-line)] bg-white px-4 py-2.5 text-md font-semibold text-[var(--mache-text)] hover:border-[var(--mache-primary)]";

export default async function PartnerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const partner = partnerBySlug(slug) ?? (await fetchDbPartner(slug));

  if (!partner) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/partenaires" className="text-sm font-semibold text-[var(--mache-muted)] hover:underline">
        ← Partenaires
      </Link>

      <article className="mt-4 overflow-hidden rounded-[8px] border border-[var(--mache-line)] bg-white">
        {partner.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.banner} alt="" className="h-40 w-full object-cover sm:h-56" />
        ) : (
          <div className="h-24 bg-[var(--mache-text)] sm:h-32" aria-hidden="true" />
        )}

        <div className="px-5 pb-6 sm:px-8">
          {partner.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={partner.logo}
              alt={`Logo de ${partner.name}`}
              className="-mt-10 h-20 w-20 rounded-[8px] border-4 border-white bg-white object-contain"
            />
          )}

          <h1 className={`text-3xl font-bold tracking-tight text-[var(--mache-text)] ${partner.logo ? "mt-3" : "mt-5"}`}>
            {partner.name}
          </h1>

          {partner.category && (
            <p className="mt-2 inline-block rounded-full bg-[var(--mache-bg-2)] px-3 py-1 text-sm font-semibold text-[var(--mache-text)]">
              {partner.category}
            </p>
          )}

          <p className="mt-4 text-md leading-relaxed text-[var(--mache-text)]">{partner.description || partner.does}</p>

          {partner.location && <p className="mt-3 text-md text-[var(--mache-muted)]">{partner.location}</p>}

          <div className="mt-5 flex flex-wrap gap-2.5">
            {partner.whatsapp && (
              <a
                href={whatsappLink(partner.whatsapp, `Bonjour ${partner.name}, je vous contacte depuis MACHE.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-[6px] bg-[#25d366] px-4 py-2.5 text-md font-semibold text-[#06361a] hover:bg-[#1fbd5b]"
              >
                Contacter sur WhatsApp
              </a>
            )}
            {partner.phone && (
              <a href={`tel:${partner.phone.replace(/\s+/g, "")}`} className={button}>
                Appeler
              </a>
            )}
            {partner.href && (
              <a href={partner.href} target="_blank" rel="noopener noreferrer" className={button}>
                Site web ↗<span className="sr-only"> (site externe)</span>
              </a>
            )}
            {partner.facebook && (
              <a href={partner.facebook} target="_blank" rel="noopener noreferrer" className={button}>
                Facebook ↗
              </a>
            )}
            {partner.instagram && (
              <a href={partner.instagram} target="_blank" rel="noopener noreferrer" className={button}>
                Instagram ↗
              </a>
            )}
          </div>

          {/* Ce que MACHE fait, et ne fait pas. */}
          <p className="mt-6 rounded-[8px] border border-[var(--mache-warn-line)] bg-[var(--mache-warn-soft)] p-4 text-sm leading-relaxed text-[var(--mache-muted)]">
            {partner.name} est une entreprise indépendante : son service se traite directement avec elle, selon ses
            propres conditions.
            {!partner.mediated &&
              " MACHE met en relation, ne dépose aucun dossier, ne garantit rien et ne touche rien sur ce service."}
          </p>
        </div>
      </article>
    </main>
  );
}
