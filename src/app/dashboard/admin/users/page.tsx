/*
  PAGE : les comptes.

  Elle listait les comptes de Supabase et leurs rôles. Les comptes
  vivent maintenant dans Medusa, et y sont déjà administrés : clients,
  vendeurs et membres du personnel, chacun avec ses écrans, dans le
  panneau du backend.

  Cette page ne les redit pas. Elle dit où ils sont — ce qui est plus
  utile qu'une seconde liste, forcément en retard sur la première.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/medusa/admin";
import { medusaBackendUrl } from "@/lib/medusa/config";

export const dynamic = "force-dynamic";

const WHERE = [
  {
    title: "Clients",
    text: "Comptes d'achat, adresses, commandes. Dans le panneau, section Clients.",
  },
  {
    title: "Vendeurs et leurs équipes",
    text: "Chaque boutique a ses membres et ses droits. Dans le panneau, section Boutiques.",
  },
  {
    title: "Personnel MACHÉ",
    text: "Les comptes qui ouvrent cette page. Ils se créent côté serveur, avec la commande `medusa user`.",
  },
];

export default async function AdminUsersPage() {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const backendUrl = medusaBackendUrl();
  const panelUrl = backendUrl ? `${backendUrl}/dashboard` : "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">
          Comptes
        </h1>
        <p className="mt-1 text-base text-[#565959]">
          Trois publics, trois endroits — tous dans le backend commerce.
        </p>
      </div>

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
        <div className="space-y-4">
          {WHERE.map((entry) => (
            <div key={entry.title}>
              <p className="text-base font-semibold text-[#0f1111]">
                {entry.title}
              </p>
              <p className="mt-0.5 text-base leading-relaxed text-[#565959]">
                {entry.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-base leading-relaxed text-[#565959]">
          Cette page ne duplique pas ces listes : une seconde liste est une
          liste en retard sur la première, et c'est toujours la mauvaise
          qu'on finit par croire.
        </p>

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
            déploiement.
          </p>
        )}
      </div>

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
        <p className="text-base font-semibold text-[#0f1111]">
          Agents et partenaires
        </p>
        <p className="mt-1 text-base leading-relaxed text-[#565959]">
          Ce sont des rôles propres à MACHÉ, que Medusa ne connaît pas. Ils
          restent sur Supabase.{" "}
          <Link href="/dashboard/admin/agents" className="font-medium text-[#0f1111] underline">
            Voir leur état
          </Link>
        </p>
      </div>
    </div>
  );
}
