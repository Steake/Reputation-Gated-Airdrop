import type { ToastMessage } from "$lib/types";
import { writable } from "svelte/store";

let toastId = 0;

function createToastStore() {
  const { subscribe, update } = writable<ToastMessage[]>([]);

  function addToast(
    message: string,
    type: ToastMessage["type"] = "info",
    duration = 5000,
  ) {
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
    info: (message: string, duration?: number) =>
      addToast(message, "info", duration),
    success: (message: string, duration?: number) =>
      addToast(message, "success", duration),
    warning: (message: string, duration?: number) =>
      addToast(message, "warning", duration),
    error: (message: string, duration?: number) =>
      addToast(message, "error", duration),
    remove: removeToast,
  };
}

export const toasts = createToastStore();
