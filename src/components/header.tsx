"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";

export function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--mache-white)]/95 backdrop-blur">
      {menuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/20"
        />
      )}

      <div className="container-page relative">
        <div className="grid min-h-[76px] grid-cols-[170px_1fr_auto] items-center gap-4 py-3">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--mache-primary)] text-lg text-white">
              M
            </div>
            <div className="text-[22px] font-extrabold tracking-[-0.04em]">
              Mache
            </div>
          </Link>

          <div className="hidden md:flex">
            <div className="relative flex w-full rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)]">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="min-w-[135px] border-r border-[var(--mache-line)] bg-[var(--mache-bg-2)] px-3 text-left text-[12px] font-semibold outline-none"
              >
                ☰ Menu
              </button>

              {menuOpen && (
                <aside className="fixed left-0 top-0 z-50 h-screen w-[340px] overflow-y-auto border-r border-[var(--mache-line)] bg-white p-5 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--mache-primary)] text-lg text-white">
                        M
                      </div>
                      <div className="text-xl font-extrabold">Mache</div>
                    </div>

                    <button
                      type="button"
                      onClick={closeMenu}
                      className="rounded-full border border-[var(--mache-line)] px-3 py-1 text-sm font-bold hover:bg-[var(--mache-bg-2)]"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-4">
                    <input
                      className="w-full rounded-xl border border-[var(--mache-line)] px-4 py-3 text-sm outline-none"
                      placeholder="Rechercher dans le menu..."
                    />
                  </div>

                  <div className="mb-4 rounded-xl bg-[var(--mache-bg-2)] p-3">
                    <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                      Accès rapide
                    </div>
                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/shop?sort=best" className="rounded-lg px-3 py-2 hover:bg-white">🔥 Meilleures ventes</Link>
                      <Link onClick={closeMenu} href="/shop?sort=new" className="rounded-lg px-3 py-2 hover:bg-white">✨ Nouveautés</Link>
                      <Link onClick={closeMenu} href="/shop?promo=true" className="rounded-lg px-3 py-2 hover:bg-white">🏷️ Promotions</Link>
                      <Link onClick={closeMenu} href="/shop" className="rounded-lg px-3 py-2 hover:bg-white">🛍️ Tout le catalogue</Link>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                      Catégories
                    </div>
                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/shop?category=vetements" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Vêtements</Link>
                      <Link onClick={closeMenu} href="/shop?category=bijoux" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Bijoux</Link>
                      <Link onClick={closeMenu} href="/shop?category=herbes" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Herbes</Link>
                      <Link onClick={closeMenu} href="/shop?category=cuisine" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Cuisine</Link>
                      <Link onClick={closeMenu} href="/shop?category=maison" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Maison</Link>
                      <Link onClick={closeMenu} href="/shop?category=chaussures" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Chaussures</Link>
                      <Link onClick={closeMenu} href="/shop?category=handmade" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Fait main / Handmade</Link>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                      Trier / Filtrer
                    </div>
                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/shop?sort=price-asc" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Prix croissant</Link>
                      <Link onClick={closeMenu} href="/shop?sort=price-desc" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Prix décroissant</Link>
                      <Link onClick={closeMenu} href="/shop?available=true" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Disponible maintenant</Link>
                    </div>
                  </div>

                  <div className="border-t border-[var(--mache-line)] pt-4">
                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/services" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Services</Link>
                      <Link onClick={closeMenu} href="/contact" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Contact</Link>
                      <Link onClick={closeMenu} href="/sell" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Nous rejoindre</Link>
                    </div>
                  </div>
                </aside>
              )}

              <input
                className="flex-1 bg-transparent px-4 py-3 text-[13px] outline-none"
                placeholder="Rechercher produits, vendeurs, catégories..."
              />

              <button className="bg-[var(--mache-primary)] px-5 text-sm font-semibold text-white">
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary">Login</Link>
            <Link href="/register" className="btn-primary">Register</Link>

            <button onClick={openCart} className="btn-secondary relative">
              Panier
              <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--mache-primary)] px-1.5 py-0.5 text-[10px] font-[800] text-white">
                {count}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-1 overflow-x-auto whitespace-nowrap border-t border-[var(--mache-line)] py-2 text-[12px] text-[var(--mache-muted)] md:flex">
          <Link href="/shop?sort=best" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Meilleures ventes</Link>
          <Link href="/shop?sort=new" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Nouveautés</Link>
          <Link href="/shop?promo=true" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Promotions</Link>
          <Link href="/shop" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Catalogue</Link>
          <Link href="/services" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Services</Link>
          <Link href="/contact" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Contact</Link>
          <Link href="/sell" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Nous rejoindre</Link>
        </div>
      </div>
    </header>
  );
}
