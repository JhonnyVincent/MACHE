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
        mono: ["var(--font-inter)", "system-ui", "sans-serif"]
      },

      /*
        ÉCHELLE TYPOGRAPHIQUE MACHÉ

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
        "2xs": ["10.5px", { lineHeight: "1.4" }],
        xs: ["11.5px", { lineHeight: "1.45" }],
        sm: ["12.5px", { lineHeight: "1.5" }],
        base: ["13.5px", { lineHeight: "1.55" }],
        md: ["14.5px", { lineHeight: "1.6" }],
        lg: ["16px", { lineHeight: "1.5" }],
        xl: ["19px", { lineHeight: "1.35" }],
        "2xl": ["22px", { lineHeight: "1.25" }],
        "3xl": ["26px", { lineHeight: "1.2" }],
        "4xl": ["32px", { lineHeight: "1.12" }],
        /* Réservé au bandeau d'accueil, qui s'adapte à la largeur. */
        hero: ["clamp(28px, 4.2vw, 46px)", { lineHeight: "1.06" }]
      },

      fontWeight: {
        /*
          Trois graisses, pas huit. `font-black` et `font-[900]`
          coexistaient, comme `font-bold` et `font-[700]` : la même
          épaisseur écrite de deux façons, ce qui empêche de voir qu'on
          en emploie trop.
        */
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        black: "800"
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
        label: "0.08em",
        widest: "0.11em"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        // Ombres plates et discrètes pour les cartes du dashboard.
        card: "0 1px 2px rgba(15, 27, 46, 0.04), 0 1px 3px rgba(15, 27, 46, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 27, 46, 0.08), 0 2px 4px rgba(15, 27, 46, 0.04)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
