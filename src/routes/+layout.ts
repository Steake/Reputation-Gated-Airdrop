import { parseConfig } from "$lib/config";
import { error } from "@sveltejs/kit";
import { browser } from "$app/environment";

export function load() {
  // Only validate config on the client side to avoid SSR issues with env vars
  if (browser) {
    const configResult = parseConfig();

    if ("error" in configResult) {
      const errorMessages = configResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n");
      throw error(
        500,
        `Application configuration is invalid. Please check your .env file.\n\nDetails:\n${errorMessages}`
      );
    }

    return {
      config: configResult,
    };
  }

  // Return empty config for SSR
  return {
    config: null,
  };
}
