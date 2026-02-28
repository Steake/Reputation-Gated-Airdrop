import adapter from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Use the Netlify adapter for deployment on Netlify.
    // See https://kit.svelte.dev/docs/adapter-netlify for more information.
    adapter: adapter(),
  },
};

export default config;
