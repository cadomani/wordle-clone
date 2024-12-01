/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        shake: "shake 0.3s ease-in-out",
        wave: "wave 0.7s ease-in-out",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-10px)" },
          "50%": { transform: "translateX(10px)" },
          "75%": { transform: "translateX(-10px)" },
        },
        wave: {
          "0%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-40px)" },
          "40%": { transform: "translateY(30px)" },
          "60%": { transform: "translateY(-20px)" },
          "80%": { transform: "translateY(10px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
