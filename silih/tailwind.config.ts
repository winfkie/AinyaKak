import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/context/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          charcoal: "#0F172A"
        },
        brand: {
          DEFAULT: "#0F172A",
          accent: "#059669",
          warn: "#D97706"
        }
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
