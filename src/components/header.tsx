"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";

const translations = {
  fr: {
    menu: "Menu",
    searchMenu: "Rechercher dans le menu...",
    searchPlaceholder: "Rechercher produits, vendeurs, catégories...",
    search: "Rechercher",
    quickAccess: "Accès rapide",
    bestSellers: "Meilleures ventes",
    newArrivals: "Nouveautés",
    promotions: "Promotions",
    catalog: "Tout le catalogue",
    categories: "Catégories",
    clothing: "Vêtements",
    jewelry: "Bijoux",
    herbs: "Herbes",
    kitchen: "Cuisine",
    home: "Maison",
    shoes: "Chaussures",
    handmade: "Fait main",
    sortFilter: "Trier / Filtrer",
    priceAsc: "Prix croissant",
    priceDesc: "Prix décroissant",
    available: "Disponible maintenant",
    services: "Services",
    contact: "Contact",
    join: "Nous rejoindre",
    login: "Se connecter",
    register: "S'enregistrer",
    cart: "Panier"
  },
  en: {
    menu: "Menu",
    searchMenu: "Search in menu...",
    searchPlaceholder: "Search products, sellers, categories...",
    search: "Search",
    quickAccess: "Quick access",
    bestSellers: "Best sellers",
    newArrivals: "New arrivals",
    promotions: "Promotions",
    catalog: "Full catalog",
    categories: "Categories",
    clothing: "Clothing",
    jewelry: "Jewelry",
    herbs: "Herbs",
    kitchen: "Kitchen",
    home: "Home",
    shoes: "Shoes",
    handmade: "Handmade",
    sortFilter: "Sort / Filter",
    priceAsc: "Lowest price",
    priceDesc: "Highest price",
    available: "Available now",
    services: "Services",
    contact: "Contact",
    join: "Join us",
    login: "Login",
    register: "Register",
    cart: "Cart"
  },
  es: {
    menu: "Menú",
    searchMenu: "Buscar en el menú...",
    searchPlaceholder: "Buscar productos, vendedores, categorías...",
    search: "Buscar",
    quickAccess: "Acceso rápido",
    bestSellers: "Más vendidos",
    newArrivals: "Novedades",
    promotions: "Promociones",
    catalog: "Todo el catálogo",
    categories: "Categorías",
    clothing: "Ropa",
    jewelry: "Joyas",
    herbs: "Hierbas",
    kitchen: "Cocina",
    home: "Hogar",
    shoes: "Zapatos",
    handmade: "Hecho a mano",
    sortFilter: "Ordenar / Filtrar",
    priceAsc: "Precio más bajo",
    priceDesc: "Precio más alto",
    available: "Disponible ahora",
    services: "Servicios",
    contact: "Contacto",
    join: "Únete a nosotros",
    login: "Iniciar sesión",
    register: "Registrarse",
    cart: "Carrito"
  },
  ar: {
    menu: "القائمة",
    searchMenu: "ابحث في القائمة...",
    searchPlaceholder: "ابحث عن المنتجات والبائعين والفئات...",
    search: "بحث",
    quickAccess: "وصول سريع",
    bestSellers: "الأكثر مبيعًا",
    newArrivals: "وصل حديثًا",
    promotions: "العروض",
    catalog: "كل المنتجات",
    categories: "الفئات",
    clothing: "ملابس",
    jewelry: "مجوهرات",
    herbs: "أعشاب",
    kitchen: "مطبخ",
    home: "منزل",
    shoes: "أحذية",
    handmade: "صناعة يدوية",
    sortFilter: "ترتيب / تصفية",
    priceAsc: "السعر الأقل",
    priceDesc: "السعر الأعلى",
    available: "متوفر الآن",
    services: "الخدمات",
    contact: "اتصال",
    join: "انضم إلينا",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    cart: "السلة"
  },
  ht: {
    menu: "Meni",
    searchMenu: "Chèche nan meni an...",
    searchPlaceholder: "Chèche pwodwi, vandè, kategori...",
    search: "Chèche",
    quickAccess: "Aksè rapid",
    bestSellers: "Pi byen vann",
    newArrivals: "Nouvo pwodwi",
    promotions: "Pwomosyon",
    catalog: "Tout katalòg la",
    categories: "Kategori",
    clothing: "Rad",
    jewelry: "Bijou",
    herbs: "Zèb",
    kitchen: "Kizin",
    home: "Kay",
    shoes: "Soulye",
    handmade: "Fèt alamen",
    sortFilter: "Klase / Filtre",
    priceAsc: "Pi bon mache",
    priceDesc: "Pi chè",
    available: "Disponib kounye a",
    services: "Sèvis",
    contact: "Kontak",
    join: "Vin jwenn nou",
    login: "Konekte",
    register: "Kreye kont",
    cart: "Panye"
  }
};

type Lang = keyof typeof translations;

export function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");

  const t = translations[lang];
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mache_locale="))
      ?.split("=")[1] as Lang | undefined;

    if (saved && translations[saved]) {
      setLang(saved);
    }
  }, []);

  function changeLang(newLang: Lang) {
    document.cookie = `mache_locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  }

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
                ☰ {t.menu}
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

                  <div className="mb-4 flex gap-1 rounded-xl border border-[var(--mache-line)] bg-white p-1 text-xs font-bold">
                    {(["fr", "en", "es", "ar", "ht"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => changeLang(l)}
                        className={`flex-1 rounded-lg px-2 py-2 ${
                          lang === l
                            ? "bg-[var(--mache-primary)] text-white"
                            : "text-[var(--mache-muted)] hover:bg-[var(--mache-primary-soft)] hover:text-[var(--mache-primary)]"
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <input
                      className="w-full rounded-xl border border-[var(--mache-line)] px-4 py-3 text-sm outline-none"
                      placeholder={t.searchMenu}
                    />
                  </div>

                  <div className="mb-4 rounded-xl bg-[var(--mache-bg-2)] p-3">
                    <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                      {t.quickAccess}
                    </div>

                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/shop?sort=best" className="rounded-lg px-3 py-2 hover:bg-white">🔥 {t.bestSellers}</Link>
                      <Link onClick={closeMenu} href="/shop?sort=new" className="rounded-lg px-3 py-2 hover:bg-white">✨ {t.newArrivals}</Link>
                      <Link onClick={closeMenu} href="/shop?promo=true" className="rounded-lg px-3 py-2 hover:bg-white">🏷️ {t.promotions}</Link>
                      <Link onClick={closeMenu} href="/shop" className="rounded-lg px-3 py-2 hover:bg-white">🛍️ {t.catalog}</Link>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                      {t.categories}
                    </div>

                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/shop?category=vetements" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.clothing}</Link>
                      <Link onClick={closeMenu} href="/shop?category=bijoux" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.jewelry}</Link>
                      <Link onClick={closeMenu} href="/shop?category=herbes" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.herbs}</Link>
                      <Link onClick={closeMenu} href="/shop?category=cuisine" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.kitchen}</Link>
                      <Link onClick={closeMenu} href="/shop?category=maison" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.home}</Link>
                      <Link onClick={closeMenu} href="/shop?category=chaussures" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.shoes}</Link>
                      <Link onClick={closeMenu} href="/shop?category=handmade" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.handmade}</Link>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 text-xs font-extrabold uppercase text-[var(--mache-muted)]">
                      {t.sortFilter}
                    </div>

                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/shop?sort=price-asc" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.priceAsc}</Link>
                      <Link onClick={closeMenu} href="/shop?sort=price-desc" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.priceDesc}</Link>
                      <Link onClick={closeMenu} href="/shop?available=true" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.available}</Link>
                    </div>
                  </div>

                  <div className="border-t border-[var(--mache-line)] pt-4">
                    <div className="grid gap-1 text-sm">
                      <Link onClick={closeMenu} href="/services" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.services}</Link>
                      <Link onClick={closeMenu} href="/contact" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.contact}</Link>
                      <Link onClick={closeMenu} href="/sell" className="rounded-lg px-3 py-2 hover:bg-[var(--mache-bg-2)]">{t.join}</Link>
                    </div>
                  </div>
                </aside>
              )}

              <input
                className="flex-1 bg-transparent px-4 py-3 text-[13px] outline-none"
                placeholder={t.searchPlaceholder}
              />

              <button className="bg-[var(--mache-primary)] px-5 text-sm font-semibold text-white">
                {t.search}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-lg border border-[var(--mache-line)] bg-white px-1 py-1 text-xs font-bold lg:flex">
              {(["fr", "en", "es", "ar", "ht"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => changeLang(l)}
                  className={`rounded-md px-2 py-1 ${
                    lang === l
                      ? "bg-[var(--mache-primary)] text-white"
                      : "text-[var(--mache-muted)] hover:bg-[var(--mache-primary-soft)] hover:text-[var(--mache-primary)]"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Link href="/login" className="btn-secondary">
              {t.login}
            </Link>

            <Link href="/register" className="btn-primary">
              {t.register}
            </Link>

            <button onClick={openCart} className="btn-secondary relative">
              {t.cart}
              <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--mache-primary)] px-1.5 py-0.5 text-[10px] font-[800] text-white">
                {count}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-1 overflow-x-auto whitespace-nowrap border-t border-[var(--mache-line)] py-2 text-[12px] text-[var(--mache-muted)] md:flex">
          <Link href="/shop?sort=best" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.bestSellers}</Link>
          <Link href="/shop?sort=new" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.newArrivals}</Link>
          <Link href="/shop?promo=true" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.promotions}</Link>
          <Link href="/shop" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.catalog}</Link>
          <Link href="/services" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.services}</Link>
          <Link href="/contact" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.contact}</Link>
          <Link href="/sell" className="rounded-full px-3 py-2 hover:bg-[var(--mache-bg-2)] hover:text-[var(--mache-text)]">{t.join}</Link>
        </div>
      </div>
    </header>
  );
}
