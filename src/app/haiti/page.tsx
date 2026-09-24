/*
  PAGE : Haïti, département par département.

  Ce qu'elle est

  Une carte des dix départements, et pour chacun : son chef-lieu,
  quelques lignes, et les boutiques MACHÉ qui s'y trouvent.

  Ce qu'elle n'est pas

  Une décoration. Les chiffres viennent des adresses que les vendeurs
  ont renseignées ; quand un département n'en compte aucune, elle le
  dit. Une carte qui afficherait des chiffres flatteurs se démentirait
  au premier clic — et une carte à laquelle on ne peut pas se fier ne
  sert à rien, jolie ou non.

  Pourquoi une page à part, et pas l'accueil

  L'accueil est la page la plus visitée et la plus pressée : y poser
  une carte interactive la ralentirait pour tout le monde, y compris
  pour qui vient chercher un article précis.
*/

import Link from "next/link";
import { HaitiMap, type DepartmentShops } from "@/components/haiti-map";
import { DEPARTMENTS } from "@/lib/haiti";
import { fetchSellers } from "@/lib/medusa/catalog";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Haïti, région par région — MACHÉ",
  description:
    "Les dix départements d'Haïti, leurs chefs-lieux, et les boutiques MACHÉ qu'on y trouve.",
};

/*
  Ramener une province ou une ville écrite à la main vers un
  département.

  Un vendeur saisit son adresse librement : « Ouest », « ouest »,
  « Port-au-Prince », « Cap Haitien ». On rapproche sans accent ni
  ponctuation, et on accepte aussi le nom du chef-lieu — c'est ce qu'on
  écrit le plus souvent quand on remplit une adresse.
*/
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

function departmentSlugFor(province: string | null, city: string | null): string | null {
  const candidates = [province, city].filter(Boolean).map((v) => normalise(v as string));

  if (candidates.length === 0) return null;

  for (const department of DEPARTMENTS) {
    const keys = [
      normalise(department.name),
      normalise(department.capital),
      normalise(department.slug),
    ];

    if (candidates.some((candidate) => keys.includes(candidate))) {
      return department.slug;
    }
  }

  return null;
}

export default async function HaitiPage() {
  const result = await fetchSellers(200);

  if (!result.ok) reportOutage("carte des départements", result.reason);

  const shops: DepartmentShops = {};

  for (const seller of result.ok ? result.data.sellers : []) {
    const address = (seller as unknown as { address?: Record<string, unknown> })
      .address;

    const slug = departmentSlugFor(
      typeof address?.province === "string" ? address.province : null,
      typeof address?.city === "string" ? address.city : null
    );

    if (!slug) continue;

    shops[slug] = (shops[slug] ?? 0) + 1;
  }

  const placed = Object.values(shops).reduce((sum, n) => sum + n, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Haïti, département par département
      </h1>

      <p className="mt-3 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
        Dix départements, dix chefs-lieux. Parcourez la carte pour voir ce
        qu&apos;on vend d&apos;où.
      </p>

      <div className="mt-8">
        <HaitiMap shops={shops} />
      </div>

      {placed === 0 && (
        /*
          Rien à afficher nulle part : on l'annonce une fois, en clair,
          plutôt que de laisser découvrir dix fois « aucune boutique ».
        */
        <div className="mt-8 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
          <p className="text-base font-semibold text-[var(--mache-text)]">
            Aucune boutique n&apos;a encore renseigné son adresse.
          </p>

          <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
            La carte se remplira d&apos;elle-même : chaque vendeur qui
            indique où il se trouve y apparaît. En attendant, le catalogue
            reste accessible en entier.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Voir tout le catalogue
            </Link>

            <Link
              href="/sell"
              className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-base font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
            >
              Ouvrir une boutique
            </Link>
          </div>
        </div>
      )}

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[var(--mache-muted)]">
        Fond de carte : Natural Earth, domaine public. Les textes de
        présentation sont volontairement courts ; signalez-nous toute
        erreur, ce sont des lieux avant d&apos;être des arguments.
      </p>
    </main>
  );
}
