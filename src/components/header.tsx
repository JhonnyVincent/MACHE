"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";

export function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--mache-white)]/95 backdrop-blur">
      <div className="container-page">
        <div className="grid min-h-[76px] grid-cols-[170px_1fr_auto] items-center gap-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--mache-primary)] text-lg text-white">
              M
            </div>
            <div className="text-[22px] font-extrabold tracking-[-0.04em]">
              Mache
            </div>
          </Link>

          <div className="hidden md:flex">
            <div className="relative flex w-full overflow-visible rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)]">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="min-w-[130px] border-r border-[var(--mache-line)] bg-[var(--mache-bg-2)] px-3 text-left text-[12px] font-semibold outline-none"
              >
                ☰ Menu
              </button>

              {menuOpen && (
                <div className="absolute left-0 top-[52px] z-50 w-[320px] rounded-xl border border-[var(--mache-line)] bg-white p-4 shadow-xl">
                  <div className="mb-3 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                    Catégories
                  </div>

                  <div className="grid gap-1 text-sm">
                    <Link href="/shop?category=vetements" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Vêtements</Link>
                    <Link href="/shop?category=bijoux" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Bijoux</Link>
                    <Link href="/shop?category=herbes" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Herbes</Link>
                    <Link href="/shop?category=cuisine" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Cuisine</Link>
                    <Link href="/shop?category=maison" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Maison</Link>
                    <Link href="/shop?category=chaussures" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Chaussures</Link>
                    <Link href="/shop?category=handmade" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Fait main / Handmade</Link>
                  </div>

                  <div className="my-3 border-t border-[var(--mache-line)]" />

                  <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                    Trier / Filtrer
                  </div>

                  <div className="grid gap-1 text-sm">
                    <Link href="/shop?sort=best" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Meilleures ventes</Link>
                    <Link href="/shop?sort=new" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Nouveautés</Link>
                    <Link href="/shop?promo=true" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Promotions</Link>
                    <Link href="/shop?sort=price-asc" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Prix croissant</Link>
                    <Link href="/shop?sort=price-desc" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Prix décroissant</Link>
                  </div>

                  <div className="my-3 border-t border-[var(--mache-line)]" />

                  <div className="grid gap-1 text-sm">
                    <Link href="/services" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Services</Link>
                    <Link href="/contact" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Contact</Link>
                    <Link href="/sell" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">Nous rejoindre</Link>
                  </div>
                </div>
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
          <Link href="/shop" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Shop</Link>
          <Link href="/sell" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Sell</Link>
          <Link href="/export" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Export</Link>
          <Link href="/verify-agent" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Verify Agent</Link>
          <Link href="/about" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">About</Link>
          <Link href="/services" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Services</Link>
          <Link href="/contact" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">Contact</Link>
        </div>
      </div>
    </header>
  );
}
