
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      config: import('$lib/config').Config;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
