module.exports = {
  // Enable JIT-style content scanning for all app files
  content: [
    "./src/**/*.{html,js,svelte,ts,jsx,tsx}",
    "./index.html",
    // include config, scripts, or other top-level files if they contain classes
    "./src/*.{js,ts}",
  ],

  // Use class-based dark mode so we can control it from the app (recommended)
  darkMode: "class",

  theme: {
    // Centered container with responsive padding to match the app's layout helpers
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },

    extend: {
      // Brand colors & small palette additions to keep CSS vars and Tailwind in sync
      colors: {
        brand: {
          DEFAULT: "#6c5ce7",
          dark: "#5546d1",
        },
        muted: {
          DEFAULT: "#6b7280",
        },
        // Provide semantic names that can map to existing CSS vars in app.css
        bg: "var(--bg)",
        card: "var(--card)",
      },

      // Match the border radius used in the project's app.css
      borderRadius: {
        lg: "0.75rem",
      },

      // Helpful shadow token
      boxShadow: {
        "surface-1": "0 6px 18px rgba(15, 23, 42, 0.06)",
        "surface-2": "0 10px 30px rgba(2, 6, 23, 0.08)",
      },

      // Keep font stack consistent with app.css
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },

      // Small spacing / sizing helpers if needed
      spacing: {
        13: "3.25rem",
      },
    },
  },

  // Plugins (forms is already present as a dependency)
  plugins: [require("@tailwindcss/forms")],
};
