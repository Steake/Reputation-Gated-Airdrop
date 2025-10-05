import { browser } from "$app/environment";
import { parseConfig } from "$lib/config";

export function load() {
  // Only parse config client-side where VITE_ variables are available
  if (browser) {
    const configResult = parseConfig();
    if ("error" in configResult) {
      // Return error state to be handled in layout component
      return {
        config: null,
        configError: configResult.error,
      };
    }
    return {
      config: configResult,
      configError: null,
    };
  }

  // Return null config for SSR (will be populated client-side)
  return {
    config: null,
    configError: null,
  };
}
