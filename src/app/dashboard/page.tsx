/*
  PAGE : l'aiguillage vers son espace.

  Elle lisait un rôle dans l'ancien socle pour décider où envoyer la
  personne. Ce projet est supprimé : la page ne savait donc plus rien
  et affichait « espace indisponible » à tout le monde, y compris à des
  vendeurs et des administrateurs parfaitement identifiés ailleurs.

  Il n'y a plus de « rôle » à lire quelque part. Chaque espace a sa
  propre identité, et c'est la bonne façon de faire : un vendeur est un
  membre de boutique chez Mercur, un agent est un client dans un groupe,
  un administrateur est un membre du personnel. On demande donc à
  chacun, dans l'ordre du plus privilégié au moins privilégié, et le
  premier qui répond gagne.

  POURQUOI CET ORDRE

  Une même personne peut être les deux : le dirigeant de MACHÉ achète
  aussi. L'envoyer vers son espace d'achat alors qu'il vient piloter le
  site serait le geste le plus agaçant possible — et l'inverse n'est
  jamais grave, puisqu'un lien mène toujours à l'autre espace.

  SI PERSONNE NE RÉPOND

  On ne renvoie pas vers une page de connexion : on ne sait pas
  laquelle. On montre les portes, et la personne sait laquelle est la
  sienne mieux que nous.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/medusa/admin";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { getCustomer } from "@/lib/medusa/customer";

export const dynamic = "force-dynamic";

const PORTES = [
  {
    titre: "Espace client",
    texte: "Vos commandes, vos adresses, vos devis et vos messages.",
    href: "/compte/connexion",
  },
  {
    titre: "Espace vendeur",
    texte: "Votre boutique, vos livraisons, vos contrats avec MACHÉ.",
    href: "/dashboard/seller/connexion",
  },
  {
    titre: "Espace agent",
    texte: "Les colis que vous portez ou que vous gardez en point de retrait.",
    href: "/dashboard/agent/connexion",
  },
  {
    titre: "Administration",
    texte: "Réservé à l'équipe de MACHÉ.",
    href: "/dashboard/admin/connexion",
  },
];

export default async function DashboardRedirectPage() {
  /*
    Dans cet ordre, et chacun est demandé à part : ces trois identités
    vivent dans des sessions différentes, et être l'une n'apprend rien
    sur les autres.
  */
  const admin = await getAdminUser();

  if (admin) redirect("/dashboard/admin");

  const vendor = await getVendorSeller();

  if (vendor) redirect("/dashboard/seller");

  const customer = await getCustomer();

  if (customer) redirect("/dashboard/buyer");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Quel espace ?
      </h1>

      <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
        Vous n&apos;êtes connecté à aucun. Chacun a sa propre entrée — celle
        que vous utilisez d&apos;habitude est la bonne.
      </p>

      <ul className="mt-6 space-y-3">
        {PORTES.map((porte) => (
          <li key={porte.href}>
            <Link
              href={porte.href}
              className="block rounded-lg border border-[var(--mache-line)] bg-white p-4 transition-colors hover:border-[var(--mache-primary)]"
            >
              <p className="font-semibold text-[var(--mache-text)]">{porte.titre}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--mache-muted)]">
                {porte.texte}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
