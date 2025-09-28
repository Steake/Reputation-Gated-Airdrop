import { init } from "@sentry/sveltekit";

init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE || "development",
  tracesSampleRate: 1.0,
});
