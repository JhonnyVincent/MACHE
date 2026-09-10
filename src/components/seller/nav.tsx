"use client";

/*
  Navigation de l'espace vendeur.

  Composant client : l'état actif se déduit du chemin courant, ce qui
  évite de le recalculer dans chaque page.
*/

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
  badge?: number;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

function useIsActive() {
  const pathname = usePathname() || "";

  return (href: string) => {
    if (href === "/dashboard/seller") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

export function SellerSidebarNav({ sections }: { sections: NavSection[] }) {
  const isActive = useIsActive();

  return (
    <nav className="scrollbar-slim flex-1 overflow-y-auto py-2">
      {sections.map((section) => (
        <div key={section.label} className="mb-4 last:mb-0">
          <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
            {section.label}
          </p>

          <ul>
            {section.items.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 border-l-2 py-1.5 pl-3.5 pr-3 text-[12.5px] transition-colors ${
                      active
                        ? "border-[#d2162c] bg-white/[0.07] font-semibold text-white"
                        : "border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="tnum rounded-[2px] bg-[#d2162c] px-1 py-px text-[10px] font-semibold text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* Navigation horizontale de repli, sous 1024 px. */
export function SellerMobileNav({ sections }: { sections: NavSection[] }) {
  const isActive = useIsActive();
  const items = sections.flatMap((section) => section.items);

  return (
    <div className="scrollbar-slim flex gap-1 overflow-x-auto border-b border-[#d5d9d9] bg-white px-3 py-1.5 lg:hidden">
      {items.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
              active
                ? "bg-[#0a0a0a] font-semibold text-white"
                : "text-[#565959] hover:bg-[#f0f2f2]"
            }`}
          >
            {item.label}
            {item.badge ? <span className="tnum ml-1 text-[#d2162c]">{item.badge}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
