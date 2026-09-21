import Link from "next/link";

const footerShopLinks = [
  { label: "Toute la boutique", href: "/shop" },
  { label: "Mode", href: "/shop" },
  { label: "Épicerie", href: "/shop" },
  { label: "Accessoires", href: "/shop" },
  { label: "Maison", href: "/shop" },
  { label: "Beauté", href: "/shop" }
];

/*
  « Créer ma boutique » et « Dashboard vendeur » menaient à l'ancienne
  inscription Supabase, qui ne crée plus ni boutique ni catalogue depuis
  la bascule sur Medusa. Les deux pointent maintenant vers l'espace
  vendeur, qui est la seule porte réelle — et une seule entrée, plutôt
  que deux libellés pour le même endroit.
*/
const footerSellLinks = [
  { label: "Devenir vendeur", href: "/sell" },

  {
    label: "Ouvrir ma boutique",
    href: "/dashboard/seller/inscription"
  },

  {
    label: "Connexion vendeur",
    href: "/dashboard/seller/connexion"
  },

  {
    label: "Marketplace + SaaS",
    href: "/sell"
  },

  {
    label: "Guide vendeur",
    href: "/sell#guide-vendeur"
  },

  {
    label: "Support vendeur",
    href: "/contact"
  }
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
            <div className="text-2xl font-black tracking-tightest">
              Mache<span className="text-[var(--mache-primary)]">.</span>
            </div>

            <p className="mt-4 max-w-md text-sm leading-7 text-white/40">
              La marketplace caribéenne moderne. Achetez, vendez, exportez et
              développez votre activité avec une plateforme pensée pour Haïti,
              la Caraïbe et la diaspora.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/10 px-3 py-1 text-2xs text-white/55">
                🇫🇷 FR
              </span>

              <span className="rounded-md border border-white/10 px-3 py-1 text-2xs text-white/55">
                🇺🇸 EN
              </span>

              <span className="rounded-md border border-white/10 px-3 py-1 text-2xs text-white/55">
                🇭🇹 HT
              </span>

              <span className="rounded-md border border-white/10 px-3 py-1 text-2xs text-white/55">
                🇩🇴 ES
              </span>
            </div>

            <div className="mt-5 flex gap-2">
              {["f", "in", "tw", "wa"].map((item) => (
                <div
                  key={item}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white/70 transition hover:border-transparent hover:bg-[rgba(232,66,10,.35)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-base font-bold">
              Acheter
            </h4>

            <div className="space-y-2">
              {footerShopLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-white/40 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-base font-bold">
              Vendre
            </h4>

            <div className="space-y-2">
              {footerSellLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-white/40 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-base font-bold">
              Aide
            </h4>

            <div className="space-y-2">
              {footerHelpLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-white/40 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/30">
          <div>
            © 2026 Mache — Tous droits réservés.
          </div>

          <div>
            Pensé pour les Caraïbes, ouvert au monde.
          </div>
        </div>
      </div>
    </footer>
  );
}
