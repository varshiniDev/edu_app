// Colours come from CSS variables in src/index.css -> change the theme THERE.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: { colors: {
    brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", 2: "rgb(var(--brand-2) / <alpha-value>)", orange: "rgb(var(--accent) / <alpha-value>)" },
    accent: "rgb(var(--accent) / <alpha-value>)" } } },
  plugins: [],
};
