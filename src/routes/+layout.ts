import { parseConfig } from "$lib/config";
import { error } from "@sveltejs/kit";

export function load() {
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
