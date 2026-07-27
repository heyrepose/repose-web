import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        "accent-soft": "var(--color-accent-soft)",
        muted: "var(--color-muted)",
        "card-border": "var(--color-card-border)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
        sheet: "20px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: [
          "var(--font-aileron)",
          "Aileron",
          "DM Sans",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-aileron)",
          "Aileron",
          "Playfair Display",
          "Georgia",
          "serif",
        ],
        brand: ["var(--font-sarina)", "Sarina", "cursive"],
      },
      spacing: {
        screen: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
