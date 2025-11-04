import { init } from "@sentry/sveltekit";
import * as Sentry from "@sentry/sveltekit";

init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE || "development",
  tracesSampleRate: 1.0,
});

// Handle client-side errors
export function handleError({ error, event }) {
  // Report to Sentry if available
  if (Sentry.captureException) {
    Sentry.captureException(error);
  }

  console.error('Client error:', error);

  return {
    message: 'An error occurred'
  };
}
