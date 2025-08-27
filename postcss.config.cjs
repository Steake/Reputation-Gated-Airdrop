// PostCSS configuration for the project.
// Uses Tailwind CSS and Autoprefixer.
// Keep this as CommonJS because many build tools expect `postcss.config.cjs`.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
