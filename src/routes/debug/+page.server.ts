import { error } from "@sveltejs/kit";
import { parseConfig } from "$lib/config";

export function load() {
  const config = parseConfig();
  if ("error" in config || !config.DEBUG) {
    throw error(404, "Not Found");
  }
  return {};
}
