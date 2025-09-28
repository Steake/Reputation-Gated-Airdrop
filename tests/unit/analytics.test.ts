import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  analyticsStore,
  trackProofGenStart,
  trackProofGenDuration,
  trackProofGenSuccess,
  trackClaimAttempt,
  trackClaimSuccess,
  trackAttestationQuery,
} from "../../src/lib/stores/analytics";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock gtag type
interface WindowWithGtag extends Window {
  gtag: (...args: unknown[]) => void;
}

describe("Analytics Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Mock window.gtag
    (window as WindowWithGtag).gtag = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should track events and persist to localStorage", () => {
    const events: any[] = [];
    const unsubscribe = analyticsStore.subscribe((value) => {
      events.push(...value);
    });

    trackProofGenStart("exact", false);

    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe("proofGenStart");
    expect(events[0].metadata.proofType).toBe("exact");
    expect(events[0].metadata.anonymous).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "analytics_events",
      JSON.stringify(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: "proofGenStart",
            metadata: { proofType: "exact", anonymous: false },
          }),
        ])
      )
    );

    unsubscribe();
  });

  it("should limit persisted events to last 100", () => {
    // Simulate 101 events
    for (let i = 0; i < 101; i++) {
      trackClaimAttempt(i, `community${i}`);
    }

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "analytics_events",
      expect.stringContaining(
        JSON.stringify(
          expect.arrayContaining([
            expect.objectContaining({
              eventType: "claimAttempt",
              metadata: { score: 100, community: "community100" },
            }),
          ])
        )
      )
    );
    // Should not include the first event
    expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(expect.stringContaining("score: 0"));
  });

  it("should call gtag when available", () => {
    (window as WindowWithGtag).gtag = vi.fn();

    trackProofGenSuccess("threshold", true, 5000);

    expect((window as WindowWithGtag).gtag).toHaveBeenCalledWith("event", "proofGenSuccess", {
      proofType: "threshold",
      anonymous: true,
      duration: 5000,
    });
  });

  it("should not call gtag when not available", () => {
    delete (window as WindowWithGtag).gtag;

    trackClaimSuccess(750, "trust-network");

    expect((window as WindowWithGtag).gtag).not.toHaveBeenCalled();
  });

  it("should load events from localStorage on init", () => {
    const mockEvents = [
      { timestamp: "2023-01-01T00:00:00.000Z", eventType: "testEvent", metadata: { test: true } },
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEvents));

    const events: unknown[] = [];
    const unsubscribe = analyticsStore.subscribe((value) => {
      events.push(...value);
    });

    expect(events).toEqual(mockEvents);

    unsubscribe();
  });

  it("should handle convenience functions correctly", () => {
    const events: unknown[] = [];
    const unsubscribe = analyticsStore.subscribe((value) => {
      events.push(...value);
    });

    trackAttestationQuery(250);
    trackClaimAttempt(600, "web3-community");
    trackProofGenDuration("gated", false, 3000);

    expect(events.length).toBe(3);
    expect((events[0] as any).eventType).toBe("attestationQuery");
    expect((events[0] as any).metadata.duration).toBe(250);
    expect((events[1] as any).eventType).toBe("claimAttempt");
    expect((events[1] as any).metadata.score).toBe(600);
    expect((events[1] as any).metadata.community).toBe("web3-community");
    expect((events[2] as any).eventType).toBe("proofGenDuration");
    expect((events[2] as any).metadata.duration).toBe(3000);

    unsubscribe();
  });

  it("should not persist or call gtag in non-browser environment", () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const events: unknown[] = [];
    const unsubscribe = analyticsStore.subscribe((value) => {
      events.push(...value);
    });

    trackProofGenStart("anonymous", true);

    expect(events.length).toBe(1);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect((window as WindowWithGtag).gtag).not.toBeCalled();

    // Restore window
    global.window = originalWindow;

    unsubscribe();
  });
});
