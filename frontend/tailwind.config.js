/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["'Trebuchet MS'", "Verdana", "sans-serif"]
      },
      colors: {
        ink: "#07111f",
        mist: "#dce7f5",
        accent: "#f97316",
        success: "#16a34a",
        alert: "#eab308",
        danger: "#dc2626"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(7, 17, 31, 0.25)"
      },
      backgroundImage: {
        "dashboard-grid":
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
