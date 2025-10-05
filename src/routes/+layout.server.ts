// Disable SSR for the entire application
// This is necessary because we rely on client-side environment variables (VITE_*)
// which are not available during server-side rendering
export const ssr = false;
