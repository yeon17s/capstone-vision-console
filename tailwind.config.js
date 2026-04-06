/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mission: {
          bg: "var(--color-bg-main)",
          panel: "var(--color-bg-panel)",
          border: "var(--color-border-main)",
          text: "var(--color-text-main)",
          active: "var(--color-accent-green)",
          info: "var(--color-accent-blue)",
          critical: "var(--color-accent-red)",
          suspicious: "var(--color-accent-yellow)",
        },
      },
      boxShadow: {
        "mission-soft": "0 0 0 1px rgb(69 73 78 / 0.9), 0 10px 30px rgb(0 0 0 / 0.25)",
        "mission-glow-green": "0 0 18px rgb(129 199 132 / 0.35)",
        "mission-glow-blue": "0 0 18px rgb(100 181 246 / 0.35)",
        "mission-glow-red": "0 0 22px rgb(229 115 115 / 0.4)",
      },
      backgroundColor: {
        "mission-soft": "rgb(255 255 255 / 0.02)",
      },
    },
  },
  plugins: [],
};
