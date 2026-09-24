/*
  LAYOUT : espace d'administration.

  L'authentification est passée de Supabase à Medusa.

  Pourquoi : le projet Supabase a été supprimé, et cet espace
  authentifiait donc contre un service qui n'existe plus — chaque écran
  levait une erreur serveur. Les comptes du personnel vivent maintenant
  dans Medusa, la table `user`, distincte des clients et des vendeurs.

  Ce layout n'authentifie PAS.

  Il enveloppe aussi la page de connexion : y placer une redirection la
  ferait se rediriger vers elle-même, indéfiniment. Il se contente donc
  de lire la session — s'il y en a une, il dessine le panneau latéral ;
  sinon il rend la page nue, ce qui est exactement ce qu'il faut pour un
  formulaire de connexion.

  Le contrôle appartient à chaque page, comme dans l'espace vendeur.
*/

import Link from "next/link";
import { getAdminUser, fetchMarketplaceState } from "@/lib/medusa/admin";
import { adminLogoutAction } from "./actions";
import { initialsOf } from "@/lib/seller";
import { SellerSidebarNav, SellerMobileNav, type NavSection } from "@/components/seller/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();

  /*
    Pas de session : la page se débrouille seule. C'est le cas de la
    connexion, et celui d'une session expirée — la page protégée
    redirigera d'elle-même.
  */
  if (!user) {
    return <>{children}</>;
  }

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  const firstName = user.firstName || user.email.split("@")[0];

  /*
    Le nombre de boutiques en attente d'approbation : la seule urgence
    dont cet espace est responsable. Une lecture qui échoue ne met pas
    de pastille — zéro en attente et « je n'ai pas pu compter » ne
    doivent pas se ressembler.
  */
  const state = await fetchMarketplaceState();

  const pending = state.ok ? state.data.pending : 0;

  const sections: NavSection[] = [
    {
      label: "Marketplace",
      items: [
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Ce que MACHÉ gagne", href: "/dashboard/admin/revenus" },
        { label: "Boutiques", href: "/dashboard/admin/stores", badge: pending },
        { label: "Utilisateurs", href: "/dashboard/admin/users" },
        { label: "Apparence du site", href: "/dashboard/admin/apparence" },
      ],
    },
    {
      /*
        Ces trois-là lisent leurs comptes dans Supabase et restent hors
        service tant qu'il n'est pas rebranché. Ils sont laissés dans la
        navigation, et chacun le dit en s'ouvrant : les retirer ferait
        croire qu'ils n'ont jamais existé.
      */
      label: "Sur Supabase",
      items: [
        { label: "Agents", href: "/dashboard/admin/agents" },
        { label: "Partenaires", href: "/dashboard/admin/partners" },
        { label: "Blocs de contenu", href: "/dashboard/admin/widgets" },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f3] font-sans text-base text-[#0f1111] antialiased">
      <aside
        data-chrome="dark"
        className="hidden w-[216px] shrink-0 flex-col bg-[#0a0a0a] text-white lg:flex"
      >
        <div className="border-b border-white/10 px-4 py-3">
          <Link href="/" className="block">
            <p className="text-md font-bold leading-none tracking-widest">MACHE</p>
            <p className="mt-1 text-2xs font-medium uppercase tracking-widest text-white/40">
              Administration
            </p>
          </Link>
        </div>

        <SellerSidebarNav sections={sections} />

        <div className="border-t border-white/10 px-4 py-2.5">
          <p className="truncate text-xs font-medium">{displayName}</p>
          <p className="truncate text-2xs text-white/40">{user.email}</p>

          <form action={adminLogoutAction} className="mt-2">
            <button
              type="submit"
              className="text-xs text-white/45 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          data-chrome="app"
          className="flex h-12 shrink-0 items-center gap-3 border-b border-[#d5d9d9] bg-white px-3 sm:px-4"
        >
          <Link href="/" className="text-md font-bold tracking-widest lg:hidden">
            MACHE
          </Link>

          <Link
            href="/"
            className="hidden text-sm text-[#565959] underline-offset-2 hover:text-[#0f1111] hover:underline sm:block"
          >
            Voir le site public
          </Link>

          <div className="ml-auto flex items-center gap-2 border-l border-[#d5d9d9] pl-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] text-2xs font-semibold text-white">
              {initialsOf(displayName, 1)}
            </span>
            <span className="hidden text-sm font-medium sm:block">{firstName}</span>
          </div>
        </header>

        <SellerMobileNav sections={sections} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] p-3 sm:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
