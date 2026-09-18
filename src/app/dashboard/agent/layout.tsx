/*
  LAYOUT : espace agent

  Même chrome que les espaces vendeur et client — un seul système visuel
  dans tout le back-office. La navigation est courte à dessein : un agent
  travaille debout, souvent sur téléphone, et n'a que trois choses à
  faire ici.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/agents";
import { initialsOf } from "@/lib/seller";
import { SellerSidebarNav, SellerMobileNav, type NavSection } from "@/components/seller/nav";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { supabase, uid, displayName, firstName, email } = await requireAgent();

  /*
    Compteur de la tournée du jour. S'il échoue — migrations non
    appliquées — il retombe à zéro plutôt que de casser tout l'espace.
  */
  const { count: todo } = await supabase
    .from("shipments")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", uid)
    .in("status", ["assigned", "picked_up", "in_transit"]);

  const sections: NavSection[] = [
    {
      label: "Ma tournée",
      items: [
        { label: "Courses du jour", href: "/dashboard/agent", badge: todo ?? 0 },
        { label: "Historique", href: "/dashboard/agent/deliveries" },
      ],
    },
    {
      label: "Mon compte",
      items: [
        { label: "Ma carte d'agent", href: "/dashboard/agent/profile" },
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

          <div className="ml-auto flex items-center gap-2 border-l border-[#d5d9d9] pl-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a] text-2xs font-semibold text-white">
              {initialsOf(displayName, 1)}
            </span>
            <span className="hidden text-sm font-medium sm:block">{firstName}</span>
          </div>
        </header>

        <SellerMobileNav sections={sections} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1100px] p-3 sm:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
