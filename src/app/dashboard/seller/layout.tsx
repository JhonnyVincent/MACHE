/*
  LAYOUT : espace vendeur

  Définit une seule fois la barre latérale, l'en-tête et le cadre de
  contenu, pour toutes les pages de /dashboard/seller. Les pages ne
  s'occupent plus que de leurs données.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSeller, initialsOf, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import {
  SellerSidebarNav,
  SellerMobileNav,
  type NavSection,
} from "@/components/seller/nav";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, uid, displayName, firstName, roleLabel, limits, profile } =
    await requireSeller();

  /*
    Compteurs affichés dans la navigation. Requêtes `head` : on ne
    ramène aucune ligne, seulement le nombre — la barre latérale est
    rendue à chaque page de l'espace.
  */
  const { data: storeRows } = await supabase
    .from("stores")
    .select("id, legal_doc_url")
    .eq("owner_id", uid);

  const storeIds = (storeRows ?? []).map((store) => store.id);

  const [pendingOrders, lowStock] = await Promise.all([
    storeIds.length
      ? supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("store_id", storeIds)
          .eq("status", "pending")
      : Promise.resolve({ count: 0, error: null }),
    storeIds.length
      ? supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .in("store_id", storeIds)
          .lte("stock", LOW_STOCK_THRESHOLD)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  const pendingCount = pendingOrders.count ?? 0;
  const lowStockCount = lowStock.count ?? 0;

  const missingDocs =
    (profile.address_verified ? 0 : 1) +
    (storeRows ?? []).filter((store) => !store.legal_doc_url).length;

  const sections: NavSection[] = [
    {
      label: "Activité",
      items: [
        { label: "Vue d'ensemble", href: "/dashboard/seller" },
        { label: "Mes boutiques", href: "/dashboard/seller/stores" },
        { label: "Commandes", href: "/dashboard/seller/orders", badge: pendingCount },
        { label: "Livraisons", href: "/dashboard/seller/deliveries" },
      ],
    },
    {
      label: "Catalogue",
      items: [
        { label: "Stock", href: "/dashboard/seller/stock", badge: lowStockCount },
      ],
    },
    {
      label: "Finances",
      items: [
        { label: "Paiements", href: "/dashboard/seller/finance" },
        { label: "Analyses", href: "/dashboard/seller/analytics" },
      ],
    },
    {
      label: "Conformité",
      items: [
        { label: "Documents", href: "/dashboard/seller/documents", badge: missingDocs },
      ],
    },
    {
      label: "Développement",
      items: [
        { label: "Financement", href: "/dashboard/seller/financing" },
        { label: "Partenaires", href: "/dashboard/seller/partners" },
        { label: "Aide", href: "/dashboard/seller/support" },
      ],
    },
    {
      label: "Compte",
      items: [
        { label: "Notifications", href: "/dashboard/seller/notifications", badge: pendingCount },
        { label: "Paramètres", href: "/dashboard/seller/settings" },
      ],
    },
  ];

  async function signOutAction() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f3] font-sans text-[13px] text-[#0f1111] antialiased">
      {/* ---------------------------------------------------------------- */}
      {/* Barre latérale                                                   */}
      {/* ---------------------------------------------------------------- */}
      <aside
        data-chrome="dark"
        className="hidden w-[216px] shrink-0 flex-col bg-[#0a0a0a] text-white lg:flex"
      >
        <div className="border-b border-white/10 px-4 py-3">
          <Link href="/dashboard/seller" className="block">
            <p className="text-[15px] font-bold leading-none tracking-[0.12em]">MACHE</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
              Espace vendeur
            </p>
          </Link>
        </div>

        <SellerSidebarNav sections={sections} />

        <div className="border-t border-white/10 px-4 py-2.5">
          <p className="truncate text-[11.5px] font-medium">{displayName}</p>
          <p className="truncate text-[10.5px] text-white/40">
            {roleLabel} · {limits.planName}
          </p>

          <form action={signOutAction} className="mt-2">
            <button
              type="submit"
              className="text-[11px] text-white/45 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Colonne de contenu                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          data-chrome="app"
          className="flex h-12 shrink-0 items-center gap-3 border-b border-[#d5d9d9] bg-white px-3 sm:px-4"
        >
          <Link href="/dashboard/seller" className="text-[14px] font-bold tracking-[0.1em] lg:hidden">
            MACHE
          </Link>

          <Link
            href="/"
            className="hidden text-[12px] text-[#565959] underline-offset-2 hover:text-[#0f1111] hover:underline sm:block"
          >
            Voir la boutique en ligne
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dashboard/seller/notifications"
              className="relative text-[12px] text-[#565959] hover:text-[#0f1111]"
            >
              Notifications
              {pendingCount > 0 && (
                <span className="tnum ml-1 rounded-[2px] bg-[#d2162c] px-1 text-[10px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 border-l border-[#d5d9d9] pl-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] text-[10px] font-semibold text-white">
                {initialsOf(displayName, 1)}
              </span>
              <span className="hidden text-[12px] font-medium sm:block">{firstName}</span>
            </div>
          </div>
        </header>

        <SellerMobileNav sections={sections} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] p-3 sm:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
