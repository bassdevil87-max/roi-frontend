import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Distinctive choices — not Inter
        // Display: Fraunces (serif with character) for hero numbers
        // Body: Geist (neo-grotesque, readable at small sizes)
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Geist", "ui-sans-serif", "system-ui"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // From the designs — a refined financial green with neutrals
        ink: {
          DEFAULT: "#0A0A0A",
          secondary: "#525252",
          tertiary: "#A3A3A3",
          muted: "#D4D4D4",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          soft: "#FAFAFA",
          card: "#F5F5F4",
          stroke: "#EAEAEA",
        },
        money: {
          // Primary green — used in hero numbers and growth charts
          DEFAULT: "#0C7C3D",
          light: "#22A866",
          bg: "#DCF2E4",
          bgSoft: "#F0FAF3",
        },
        signal: {
          // Primary action blue — from buttons in the designs
          DEFAULT: "#2F6BFF",
          dark: "#1E4FC4",
          bg: "#EFF3FF",
        },
        warn: {
          DEFAULT: "#B45309",
          bg: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#C2410C",
          bg: "#FEE4E2",
        },
        success: {
          DEFAULT: "#0C7C3D",
          bg: "#DCF2E4",
        },
      },
      fontSize: {
        // Typographic scale — tighter at small sizes, more leading on headlines
        "micro": ["11px", { lineHeight: "14px", letterSpacing: "0.02em" }],
        "xs": ["12px", { lineHeight: "16px" }],
        "sm": ["13px", { lineHeight: "18px" }],
        "base": ["15px", { lineHeight: "22px" }],
        "lg": ["17px", { lineHeight: "24px" }],
        "xl": ["20px", { lineHeight: "26px", letterSpacing: "-0.01em" }],
        "2xl": ["24px", { lineHeight: "30px", letterSpacing: "-0.015em" }],
        "3xl": ["30px", { lineHeight: "36px", letterSpacing: "-0.02em" }],
        "hero": ["42px", { lineHeight: "46px", letterSpacing: "-0.025em" }],
        "giant": ["56px", { lineHeight: "58px", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        // Matches the designs — rounded but not soft
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
        card: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        cardHover: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)",
        soft: "0 1px 0 rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.04)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "count-up": "countUp 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
