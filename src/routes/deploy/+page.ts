import { error } from "@sveltejs/kit";
import { parseConfig } from "$lib/config";

export const prerender = false;
export const ssr = false; // Disable SSR for this page since it needs VITE_ env vars

export function load() {
  const config = parseConfig();

  if ("error" in config) {
    const messages = config.error.errors
      .map((err) => `${err.path.join(".") || "root"}: ${err.message}`)
      .join("\n");
    throw error(
      500,
      `Application configuration is invalid. Please update your environment variables.\n\n${messages}`
    );
  }

  if (!config.DEBUG) {
    throw error(404, "Not Found");
  }

  return {
    config,
  };
}
