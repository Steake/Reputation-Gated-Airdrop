import type { ToastMessage } from "$lib/types";
import { writable } from "svelte/store";
import { captureException } from "@sentry/sveltekit";

let toastId = 0;

function createToastStore() {
  const { subscribe, update } = writable<ToastMessage[]>([]);

  function addToast(message: string, type: ToastMessage["type"] = "info", duration = 5000) {
    const id = toastId++;
    update((toasts) => [...toasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  function removeToast(id: number) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    info: (message: string, duration?: number) => addToast(message, "info", duration),
    success: (message: string, duration?: number) => addToast(message, "success", duration),
    warning: (message: string, duration?: number) => addToast(message, "warning", duration),
    error: (message: string, duration?: number) => addToast(message, "error", duration),
    remove: removeToast,
  };
}

export const toasts = createToastStore();

// Global UI loading state
export const isLoading = writable(false);

function setLoading(loading: boolean) {
  isLoading.set(loading);
}

// Global UI error state with toast integration
export const uiError = writable<string | null>(null);

function setError(error: string | null) {
  uiError.set(error);
  if (error) {
    toasts.error(error);
    captureException(new Error(error), {
      contexts: {
        ui: {
          errorType: "uiError",
          timestamp: new Date().toISOString(),
        },
      },
    });
  } else {
    toasts.success("Error cleared");
  }
}

export const uiActions = {
  setLoading,
  setError,
};
