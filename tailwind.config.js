/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base (AMOLED-friendly)
        black: "#000000",
        surface: {
          0: "#0A0A0F",
          1: "#12121A",
          2: "#1A1A28",
          3: "#222235",
        },
        // Accent — Neon Cyan + Purple
        cyan: {
          DEFAULT: "#00E5FF",
          dim: "#00B8D9",
          glow: "rgba(0, 229, 255, 0.15)",
        },
        purple: {
          DEFAULT: "#A855F7",
          dim: "#7C3AED",
          glow: "rgba(168, 85, 247, 0.15)",
        },
        // Semantic
        income: "#22C55E",
        expense: "#EF4444",
        transfer: "#F59E0B",
        warning: "#F59E0B",
        // Text
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#475569",
        "text-disabled": "#334155",
        // Borders & Dividers
        border: "rgba(255, 255, 255, 0.06)",
        "border-strong": "rgba(255, 255, 255, 0.12)",
        // Glassmorphism helpers
        glass: "rgba(255, 255, 255, 0.04)",
        "glass-border": "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        regular: ["Inter-Regular"],
        medium: ["Inter-Medium"],
        "semi-bold": ["Inter-SemiBold"],
        bold: ["Inter-Bold"],
        mono: ["SpaceMono-Regular"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "13px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["15px", { lineHeight: "22px" }],
        md: ["17px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["30px", { lineHeight: "36px" }],
        "3xl": ["38px", { lineHeight: "46px" }],
      },
      spacing: {
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        20: "80px",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
