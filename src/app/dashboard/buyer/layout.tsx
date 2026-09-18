/*
  LAYOUT : espace client

  L'identité vient désormais de Medusa : c'est là que vivent les
  commandes, les adresses et le profil. Il lisait auparavant le compte
  Supabase et comptait des commandes qui ne sont plus alimentées.

  L'espace reste accessible sans être connecté : chaque page dit alors
  quoi faire. Rediriger vers une connexion depuis le gabarit priverait le
  visiteur de tout repère, et l'empêcherait même de comprendre où il est.
*/

import Link from "next/link";
import { getCustomer, getCustomerOrders } from "@/lib/medusa/customer";
import { initialsOf } from "@/lib/seller";
import { SellerSidebarNav, SellerMobileNav, type NavSection } from "@/components/seller/nav";
import { logoutAction } from "@/app/compte/actions";

export const dynamic = "force-dynamic";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer();

  const displayName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim() ||
    customer?.email ||
    "Visiteur";

  const firstName = customer?.firstName?.trim() || displayName.split(" ")[0];

  /* Compteur des commandes en cours, uniquement si quelqu'un est connecté. */
  let openCount = 0;

  if (customer) {
    const orders = await getCustomerOrders();

    if (orders.ok) {
      openCount = orders.data.filter(
        (order) => order.fulfillmentStatus !== "delivered" && order.status !== "canceled"
      ).length;
    }
  }

  const sections: NavSection[] = [
    {
      label: "Mes achats",
      items: [
        { label: "Vue d'ensemble", href: "/dashboard/buyer" },
        { label: "Mes commandes", href: "/dashboard/buyer/orders", badge: openCount },
        { label: "Mes favoris", href: "/favorites" },
      ],
    },
    {
      label: "Mon compte",
      items: [
        { label: "Adresses", href: "/dashboard/buyer/addresses" },
        { label: "Profil", href: "/dashboard/buyer/profile" },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f3] font-sans text-[13px] text-[#0f1111] antialiased">
      <aside
        data-chrome="dark"
        className="hidden w-[216px] shrink-0 flex-col bg-[#0a0a0a] text-white lg:flex"
      >
        <div className="border-b border-white/10 px-4 py-3">
          <Link href="/" className="block">
            <p className="text-[15px] font-bold leading-none tracking-[0.12em]">MACHE</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
              Espace client
            </p>
          </Link>
        </div>

        <SellerSidebarNav sections={sections} />

        <div className="border-t border-white/10 px-4 py-2.5">
          {customer ? (
            <>
              <p className="truncate text-[11.5px] font-medium">{displayName}</p>
              <p className="truncate text-[10.5px] text-white/40">{customer.email}</p>

              <form action={logoutAction} className="mt-2">
                <button
                  type="submit"
                  className="text-[11px] text-white/45 underline-offset-2 transition-colors hover:text-white hover:underline"
                >
                  Se déconnecter
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/compte/connexion"
              className="text-[11.5px] font-medium text-white/70 hover:text-white"
            >
              Se connecter →
            </Link>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          data-chrome="app"
          className="flex h-12 shrink-0 items-center gap-3 border-b border-[#d5d9d9] bg-white px-3 sm:px-4"
        >
          <Link href="/" className="text-[14px] font-bold tracking-[0.1em] lg:hidden">
            MACHE
          </Link>

          <Link
            href="/shop"
            className="hidden text-[12px] text-[#565959] underline-offset-2 hover:text-[#0f1111] hover:underline sm:block"
          >
            Continuer mes achats
          </Link>

          <div className="ml-auto flex items-center gap-2 border-l border-[#d5d9d9] pl-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] text-[10px] font-semibold text-white">
              {initialsOf(displayName, 1)}
            </span>
            <span className="hidden text-[12px] font-medium sm:block">{firstName}</span>
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
