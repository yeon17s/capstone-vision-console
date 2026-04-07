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
          primary: "var(--color-accent-primary)",
          secondary: "var(--color-accent-secondary)",
          danger: "var(--color-accent-danger)",
          warning: "var(--color-accent-warning)",
          active: "var(--color-accent-green)",
          info: "var(--color-accent-blue)",
          critical: "var(--color-accent-red)",
          suspicious: "var(--color-accent-yellow)",
        },
      },
      fontSize: {
        "mission-overline": ["var(--font-size-mission-overline)", { lineHeight: "1rem" }],
        "mission-label": ["var(--font-size-mission-label)", { lineHeight: "1rem" }],
        "mission-control": ["var(--font-size-mission-control)", { lineHeight: "1.125rem" }],
        "mission-emphasis": ["var(--font-size-mission-emphasis)", { lineHeight: "1.25rem" }],
        "mission-metric": ["var(--font-size-mission-metric)", { lineHeight: "1.25rem" }],
        "mission-display": ["var(--font-size-mission-display)", { lineHeight: "1.75rem" }],
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
