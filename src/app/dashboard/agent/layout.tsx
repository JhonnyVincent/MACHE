/*
  LAYOUT : espace agent.

  Il lisait l'ancien socle pour savoir qui était connecté, et comptait la
  tournée du jour dans une table d'un socle supprimé depuis. Il est passé sur
  Medusa : un agent est un client, il a une session client.

  Pourquoi il ne garde plus la porte

  Parce qu'il enveloppe aussi la page de connexion. Un layout qui exige
  une session pour afficher ses enfants renverrait vers la connexion la
  page de connexion elle-même — une boucle. Les pages se gardent
  elles-mêmes, et le backend refuse de toute façon tout appel sans
  session : le contrôle qui compte est là, pas dans une mise en page.

  La navigation a maigri. Les deux écrans supprimés — « historique » et
  « ma carte » — lisaient l'ancien socle eux aussi. Leur contenu tient
  maintenant dans l'écran des colis : l'historique est le même écran
  avec un autre filtre, et la carte est le bandeau du haut.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, clearCustomerSession } from "@/lib/medusa/customer";
import { initialsOf } from "@/lib/seller";
import { SellerSidebarNav, SellerMobileNav, type NavSection } from "@/components/seller/nav";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer();

  const displayName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
    customer?.email ||
    "Agent MACHÉ";

  const sections: NavSection[] = [
    {
      label: "Ma tournée",
      items: [
        { label: "Mes colis", href: "/dashboard/agent" },
        { label: "Tout l'historique", href: "/dashboard/agent?scope=all" },
      ],
    },
    {
      label: "Mon compte",
      items: [
        { label: "Mes commandes", href: "/dashboard/buyer" },
        { label: "Vérifier un agent", href: "/verify-agent" },
      ],
    },
  ];

  async function signOutAction() {
    "use server";

    await clearCustomerSession();
    redirect("/dashboard/agent/connexion");
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
              Espace agent
            </p>
          </Link>
        </div>

        <SellerSidebarNav sections={sections} />

        {customer && (
          <div className="border-t border-white/10 px-4 py-2.5">
            <p className="truncate text-xs font-medium">{displayName}</p>
            <p className="truncate text-2xs text-white/40">{customer.email}</p>

            <form action={signOutAction} className="mt-2">
              <button
                type="submit"
                className="text-xs text-white/45 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          data-chrome="app"
          className="flex h-12 shrink-0 items-center gap-3 border-b border-[#d5d9d9] bg-white px-3 sm:px-4"
        >
          <Link href="/" className="text-md font-bold tracking-widest lg:hidden">
            MACHE
          </Link>

          {customer && (
            <div className="ml-auto flex items-center gap-2 border-l border-[#d5d9d9] pl-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] text-2xs font-semibold text-white">
                {initialsOf(displayName, 1)}
              </span>
              <span className="hidden text-sm font-medium sm:block">
                {customer.firstName ?? customer.email}
              </span>
            </div>
          )}
        </header>

        {customer && <SellerMobileNav sections={sections} />}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1100px] p-3 sm:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
