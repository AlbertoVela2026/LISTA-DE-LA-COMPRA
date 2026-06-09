/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta cálida de casa menorquina
        crema: "#FBF6EC",      // fondo, pared encalada
        papel: "#FFFFFF",      // notas y tarjetas
        miel: "#E6A23C",       // acento principal (sol, madera)
        coral: "#D9663F",      // acciones cálidas
        mar: "#3E7CB1",        // azul Mediterráneo
        oliva: "#7A8450",      // verde suave
        tinta: "#3A3330",      // texto principal
        suave: "#8A817C",      // texto secundario
        cuerda: "#E7DCC8",     // bordes, corcho
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        cuerpo: ["var(--font-cuerpo)", "system-ui", "sans-serif"],
        nota: ["var(--font-nota)", "cursive"],
      },
      boxShadow: {
        nota: "0 8px 24px -10px rgba(58, 51, 48, 0.25)",
        polaroid: "0 10px 30px -12px rgba(58, 51, 48, 0.35)",
      },
      rotate: {
        "1.5": "1.5deg",
        "2.5": "-1.5deg",
      },
    },
  },
  plugins: [],
}
