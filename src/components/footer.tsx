import { Link } from "next-view-transitions";
import { SocialLinks } from "@/components/social-links";

/*
  La colonne « Acheter » proposait cinq rayons — Mode, Épicerie,
  Accessoires, Maison, Beauté — qui menaient TOUS au catalogue entier.
  Cinq libellés, une seule destination : quelqu'un qui cliquait
  « Épicerie » recevait des chaussures, et n'avait aucun moyen de
  comprendre pourquoi.

  Ces rayons étaient écrits en dur, et ne correspondaient à rien :
  les catégories d'une marketplace sont celles de ce que ses vendeurs
  vendent, et elles changent avec eux. Elles sont donc lues dans le
  catalogue, et chacune mène à sa propre page.
*/
export type FooterCategory = { handle: string; name: string };

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
    label: "Tarifs vendeurs",
    href: "/sell/tarifs"
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
  { label: "Ce que MACHE fait", href: "/services" },
  { label: "Exporter depuis Haïti", href: "/export" },
  { label: "Livraison", href: "/legal/shipping" },
  { label: "Retours", href: "/legal/returns" },
  { label: "Vérifier un agent", href: "/verify-agent" },
  { label: "Espace agent", href: "/dashboard/agent/connexion" },
  { label: "À propos", href: "/about" },
  { label: "Partenaires", href: "/partenaires" },
  { label: "Confidentialité", href: "/legal/privacy" },
  { label: "Conditions", href: "/legal/terms" }
];

export function Footer({
  categories = [],
}: {
  categories?: FooterCategory[];
}) {
  return (
    <footer className="mt-16 bg-[var(--mache-dark)] px-0 py-12 text-white">
      <div className="container-page">
        <div className="mb-8 grid gap-8 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="text-2xl font-black tracking-tightest">
              Mache<span className="text-[var(--mache-primary)]">.</span>
            </div>

            {/*
              « exportez » a été retiré : l'export n'est pas ouvert, et
              l'annoncer dans le pied de page de chaque page en faisait
              une promesse permanente.
            */}
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              La place de marché d&apos;Haïti. Des boutiques
              indépendantes, des marques et des fournisseurs d&apos;ici et
              de la diaspora, réunis au même endroit.
            </p>

            <SocialLinks className="mt-5 flex text-white" size={22} />

            {/*
              Ici s'affichaient des pastilles « EN » et « ES » — langues
              que le site ne propose pas — et quatre ronds « f, in, tw,
              wa » qui ne menaient nulle part. Remplacés par les vrais
              comptes de MACHE (au-dessus), dès qu'ils sont renseignés.
            */}
          </div>

          <div>
            <h4 className="mb-4 text-base font-bold">
              Acheter
            </h4>

            <div className="space-y-2">
              <Link
                href="/shop"
                className="block text-sm text-white/70 transition hover:text-white"
              >
                Tout le catalogue
              </Link>

              <Link
                href="/catalogue"
                className="block text-sm text-white/70 transition hover:text-white"
              >
                Tous les rayons
              </Link>

              {/*
                L'entrée pour les acheteurs professionnels. Sans elle,
                les devis, les prix dégressifs et les commandes
                minimum existaient sans que personne puisse les
                trouver.
              */}
              <Link
                href="/gros"
                className="block text-sm text-white/70 transition hover:text-white"
              >
                Acheter en gros
              </Link>

              {/*
                Les rayons réels du catalogue. Quand il n'y en a aucun —
                catalogue vide, backend injoignable — il ne reste que
                « Tout le catalogue », ce qui est vrai, plutôt qu'une
                liste de rayons inventés.
              */}
              {categories.map((category) => (
                <Link
                  key={category.handle}
                  href={`/shop?category=${encodeURIComponent(category.handle)}`}
                  className="block text-sm text-white/70 transition hover:text-white"
                >
                  {category.name}
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
                  className="block text-sm text-white/70 transition hover:text-white"
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
                  className="block text-sm text-white/70 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60">
          <div>
            © 2026 Mache. Tous droits réservés.
          </div>

          <div>
            Pensé pour les Caraïbes, ouvert au monde.
          </div>
        </div>
      </div>
    </footer>
  );
}
