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
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tightest: "-0.03em"
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
