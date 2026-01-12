/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f346ad",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#71717a",
        },
        background: "#ffffff",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#020617",
        },
        border: "#e4e4e7",
        ring: "#f346ad",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 45px rgba(15, 23, 42, 0.12)",
        "soft-lg": "0 20px 60px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};

