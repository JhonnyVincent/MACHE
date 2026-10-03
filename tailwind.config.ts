import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mache: {
          50: "#fff5f5",
          100: "#ffe3e3",
          200: "#ffc9c9",
          300: "#ffa8a8",
          400: "#ff8787",
          500: "#d9485f",
          600: "#c92a2a",
          700: "#a61e4d",
          800: "#7f1d1d",
          900: "#541212"
        },
        // Palette du dashboard : noir de la sidebar, rouge MACHE, bleu marine.
        ink: {
          DEFAULT: "#0a0a0a",
          soft: "#141414",
          line: "#1f1f1f"
        },
        brand: {
          DEFAULT: "#d2162c",
          soft: "#fdeaec",
          strong: "#b01124",
          ring: "rgba(210, 22, 44, 0.16)"
        },
        navy: {
          50: "#f2f5fa",
          100: "#e3e9f3",
          200: "#c6d2e6",
          300: "#95aacb",
          400: "#5c7aa8",
          500: "#3a5a8a",
          600: "#294570",
          700: "#1d3357",
          800: "#152540",
          900: "#0f1b2e"
        }
      },
      fontFamily: {
        /*
          Une seule famille pour tout le site : Inter.

          Le mono n'est plus une seconde famille système, qui changeait de
          dessin selon la machine du visiteur. Les rares identifiants
          techniques — référence de commande — se composent en Inter avec
          des chiffres tabulaires, ce qui suffit à les aligner.
        */
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-inter)", "system-ui", "sans-serif"]
      },

      /*
        ÉCHELLE TYPOGRAPHIQUE MACHE

        Le site en employait deux en parallèle : l'échelle Tailwind
        (text-3xl, text-5xl) sur les pages anciennes, et vingt-quatre
        tailles arbitraires en pixels sur les nouvelles. Passer de
        l'accueil à « Devenir vendeur » changeait donc de registre
        typographique, ce qui se lit comme un changement de police.

        Dix crans suffisent, chacun avec son interlignage. Les tailles
        n'y figurent qu'une fois : plus de 13px ET 13.5px à dix lignes
        d'écart.
      */
      fontSize: {
        "2xs": ["11px", { lineHeight: "1.4" }],
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["14.5px", { lineHeight: "1.6" }],
        md: ["15.5px", { lineHeight: "1.6" }],
        lg: ["17px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.35" }],
        "2xl": ["24px", { lineHeight: "1.25" }],
        "3xl": ["30px", { lineHeight: "1.2" }],
        "4xl": ["38px", { lineHeight: "1.12" }],
        /* Réservé au bandeau d'accueil, qui s'adapte à la largeur. */
        hero: ["clamp(34px, 4.6vw, 56px)", { lineHeight: "1.04" }]
      },

      fontWeight: {
        /*
          Quatre graisses d'écriture, dont deux seulement pour les titres :
          400 (texte), 500 (menus), 600 (boutons, intitulés), 700 (grands
          titres). Les anciennes « black » à 800 donnaient au site un air
          criard ; `bold` et `semibold` se confondent volontairement.
        */
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "600",
        black: "700"
      },
      /*
        Cinq crans d'approche, au lieu de dix valeurs arbitraires allant de
        -0.01em à 0.14em. `label` est l'espacement des petites capitales
        (badges, intitulés de rayon), qui ont besoin d'air pour rester
        lisibles à 10 ou 11 pixels.
      */
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.02em",
        tight: "-0.01em",
        label: "0.02em",
        widest: "0.04em"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31, 26, 23, 0.05), 0 6px 18px rgba(31, 26, 23, 0.06)",
        card: "0 1px 2px rgba(31, 26, 23, 0.05)",
        "card-hover": "0 2px 10px rgba(31, 26, 23, 0.08)"
      },
      borderRadius: {
        xl2: "12px"
      }
    }
  },
  plugins: []
};

export default config;
