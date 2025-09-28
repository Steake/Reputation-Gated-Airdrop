import { writable } from 'svelte/store';

interface AnalyticsEvent {
  timestamp: string;
  eventType: string;
  metadata: Record<string, unknown>;
}

const EVENTS_KEY = 'analytics_events';

function loadEvents(): AnalyticsEvent[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(EVENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveEvents(events: AnalyticsEvent[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-100))); // Keep last 100 events
  }
}

const { subscribe, update } = writable<AnalyticsEvent[]>(loadEvents());

export const analyticsStore = {
  subscribe,
  track: (eventType: string, metadata: Record<string, unknown> = {}) => {
    const event: AnalyticsEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      metadata
    };
    update((events) => {
      const newEvents = [...events, event];
      saveEvents(newEvents);
      // Optional Google Analytics
      if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
        window.gtag('event', eventType, metadata);
      }
      return newEvents;
    });
  }
};

// Convenience functions for specific events
export const trackProofGenStart = (proofType: string, anonymous: boolean) => {
  analyticsStore.track('proofGenStart', { proofType, anonymous });
};

export const trackProofGenDuration = (proofType: string, anonymous: boolean, duration: number) => {
  analyticsStore.track('proofGenDuration', { proofType, anonymous, duration });
};

export const trackProofGenSuccess = (proofType: string, anonymous: boolean, duration: number) => {
  analyticsStore.track('proofGenSuccess', { proofType, anonymous, duration });
};

export const trackClaimAttempt = (score: number, community?: string) => {
  analyticsStore.track('claimAttempt', { score, community });
};

export const trackClaimSuccess = (score: number, community?: string) => {
  analyticsStore.track('claimSuccess', { score, community });
};

export const trackAttestationQuery = (duration: number) => {
  analyticsStore.track('attestationQuery', { duration });
};