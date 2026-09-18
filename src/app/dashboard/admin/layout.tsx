/*
  LAYOUT : espace d'administration

  Même chrome que les espaces vendeur, client et agent. L'administration
  était jusqu'ici rendue par le routeur générique /dashboard/[role], au
  milieu du code des autres espaces ; elle a maintenant ses propres pages.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { initialsOf } from "@/lib/seller";
import { SellerSidebarNav, SellerMobileNav, type NavSection } from "@/components/seller/nav";
import { supabaseConfigured } from "@/lib/supabase/env";
import { StaffUnavailable } from "@/components/staff-unavailable";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /*
    Sans Supabase, `requireAdmin` lève et toutes les pages de cet espace
    rendaient une erreur 500. Le contrôle se fait donc ici, une fois, avant
    d'essayer : les enfants ne sont pas rendus, et l'écran dit ce qui
    manque.
  */
  if (!supabaseConfigured()) {
    return <StaffUnavailable area="Administration" />;
  }

  const { supabase, displayName, firstName, email, isSuperAdmin } = await requireAdmin();

  /*
    Compteur des boutiques en attente de vérification : c'est désormais la
    seule urgence dont cet espace est responsable. Le catalogue et les
    commandes sont passés au panneau Medusa.
  */
  const { count: unverified } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("is_verified", false);

  const sections: NavSection[] = [
    {
      label: "Marketplace",
      items: [
        { label: "Vue d'ensemble", href: "/dashboard/admin" },
        { label: "Boutiques", href: "/dashboard/admin/stores", badge: unverified ?? 0 },
      ],
    },
    {
      label: "Comptes",
      items: [
        { label: "Utilisateurs", href: "/dashboard/admin/users" },
        { label: "Agents", href: "/dashboard/admin/agents" },
        { label: "Partenaires", href: "/dashboard/admin/partners" },
      ],
    },
    {
      label: "Site",
      items: [{ label: "Blocs de contenu", href: "/dashboard/admin/widgets" }],
    },
  ];

  async function signOutAction() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

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
              {isSuperAdmin ? "Super administration" : "Administration"}
            </p>
          </Link>
        </div>

        <SellerSidebarNav sections={sections} />

        <div className="border-t border-white/10 px-4 py-2.5">
          <p className="truncate text-xs font-medium">{displayName}</p>
          <p className="truncate text-2xs text-white/40">{email}</p>

          <form action={signOutAction} className="mt-2">
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
