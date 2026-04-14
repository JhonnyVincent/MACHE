import Link from "next/link";

const footerShopLinks = [
  { label: "Toute la boutique", href: "/shop" },
  { label: "Mode", href: "/shop" },
  { label: "Épicerie", href: "/shop" },
  { label: "Accessoires", href: "/shop" },
  { label: "Maison", href: "/shop" },
  { label: "Beauté", href: "/shop" }
];

const footerSellLinks = [
  { label: "Devenir vendeur", href: "/sell" },
  { label: "Dashboard vendeur", href: "/dashboard/seller" },
  { label: "Services", href: "/services" },
  { label: "Guide vendeur", href: "/legal/vendors" },
  { label: "Support vendeur", href: "/contact" }
];

const footerHelpLinks = [
  { label: "Centre d’aide", href: "/faq" },
  { label: "Politique livraison", href: "/legal/shipping" },
  { label: "Retours", href: "/legal/returns" },
  { label: "À propos", href: "/about" },
  { label: "Confidentialité", href: "/legal/privacy" },
  { label: "Conditions", href: "/legal/terms" }
];

export function Footer() {
  return (
    <footer className="mt-16 bg-[var(--mache-dark)] px-0 py-12 text-white">
      <div className="container-page">
        <div className="mb-8 grid gap-8 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="text-[24px] font-[900] tracking-[-0.04em]">
              Mache<span className="text-[var(--mache-primary)]">.</span>
            </div>

            <p className="mt-4 max-w-md text-[12px] leading-7 text-white/40">
              La marketplace caribéenne moderne. Achetez, vendez, exportez et
              développez votre activité avec une plateforme pensée pour Haïti,
              la Caraïbe et la diaspora.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/10 px-3 py-1 text-[10px] text-white/55">
                🇫🇷 FR
              </span>
              <span className="rounded-md border border-white/10 px-3 py-1 text-[10px] text-white/55">
                🇺🇸 EN
              </span>
              <span className="rounded-md border border-white/10 px-3 py-1 text-[10px] text-white/55">
                🇭🇹 HT
              </span>
              <span className="rounded-md border border-white/10 px-3 py-1 text-[10px] text-white/55">
                🇩🇴 ES
              </span>
            </div>

            <div className="mt-5 flex gap-2">
              {["f", "in", "tw", "wa"].map((item) => (
                <div
                  key={item}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[12px] text-white/70 transition hover:border-transparent hover:bg-[rgba(232,66,10,.35)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-[700]">Acheter</h4>
            <div className="space-y-2">
              {footerShopLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-[12px] text-white/40 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-[700]">Vendre</h4>
            <div className="space-y-2">
              {footerSellLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-[12px] text-white/40 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-[700]">Aide</h4>
            <div className="space-y-2">
              {footerHelpLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-[12px] text-white/40 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-white/30">
          <div>© 2026 Mache — Tous droits réservés.</div>
          <div>Pensé pour les Caraïbes, ouvert au monde.</div>
        </div>
      </div>
    </footer>
  );
}
