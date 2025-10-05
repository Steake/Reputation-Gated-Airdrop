import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type AnalyticsExports = typeof import("$lib/stores/analytics");

interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
}

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

let analyticsStore: AnalyticsExports["analyticsStore"];
let trackProofGenStart: AnalyticsExports["trackProofGenStart"];
let trackProofGenDuration: AnalyticsExports["trackProofGenDuration"];
let trackProofGenSuccess: AnalyticsExports["trackProofGenSuccess"];
let trackClaimAttempt: AnalyticsExports["trackClaimAttempt"];
let trackClaimSuccess: AnalyticsExports["trackClaimSuccess"];
let trackAttestationQuery: AnalyticsExports["trackAttestationQuery"];

function assignLocalStorage() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: mockLocalStorage,
  });
}

function resetLocalStorageMocks() {
  mockLocalStorage.getItem.mockReset();
  mockLocalStorage.setItem.mockReset();
  mockLocalStorage.removeItem.mockReset();
  mockLocalStorage.clear.mockReset();
}

function collectEvents() {
  const events: unknown[] = [];
  const unsubscribe = analyticsStore.subscribe((value) => {
    events.splice(0, events.length, ...value);
  });
  return { events, unsubscribe };
}

describe("Analytics Store", () => {
  beforeEach(async () => {
    vi.resetModules();
    resetLocalStorageMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    assignLocalStorage();
    (window as WindowWithGtag).gtag = vi.fn();

    const module = await import("$lib/stores/analytics");
    analyticsStore = module.analyticsStore;
    trackProofGenStart = module.trackProofGenStart;
    trackProofGenDuration = module.trackProofGenDuration;
    trackProofGenSuccess = module.trackProofGenSuccess;
    trackClaimAttempt = module.trackClaimAttempt;
    trackClaimSuccess = module.trackClaimSuccess;
    trackAttestationQuery = module.trackAttestationQuery;

    analyticsStore.clear();
  });

  afterEach(() => {
    analyticsStore.clear();
    vi.restoreAllMocks();
  });

  it("should track events and persist to localStorage", () => {
    const { events, unsubscribe } = collectEvents();

    trackProofGenStart("exact", false);

    expect(events).toHaveLength(1);
    expect((events[0] as { eventType: string }).eventType).toBe("proofGenStart");
    expect((events[0] as { metadata: unknown }).metadata).toEqual({
      proofType: "exact",
      anonymous: false,
    });

    const lastCall = mockLocalStorage.setItem.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    if (lastCall) {
      const [, payload] = lastCall;
      const parsed = JSON.parse(payload as string);
      expect(parsed).toEqual(events);
    }

    unsubscribe();
  });

  it("should limit persisted events to last 100", () => {
    for (let i = 0; i < 101; i++) {
      trackClaimAttempt(i, `community${i}`);
    }

    const lastCall = mockLocalStorage.setItem.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    if (lastCall) {
      const [, payload] = lastCall;
      const parsed = JSON.parse(payload as string);
      expect(parsed).toHaveLength(100);
      expect(parsed[0]?.metadata).toEqual({ score: 1, community: "community1" });
      expect(parsed.at(-1)?.metadata).toEqual({ score: 100, community: "community100" });
    }
  });

  it("should call gtag when available", () => {
    const gtagSpy = vi.fn();
    (window as WindowWithGtag).gtag = gtagSpy;

    trackProofGenSuccess("threshold", true, 5000);

    expect(gtagSpy).toHaveBeenCalledWith("event", "proofGenSuccess", {
      proofType: "threshold",
      anonymous: true,
      duration: 5000,
    });
  });

  it("should not call gtag when not available", () => {
    delete (window as WindowWithGtag).gtag;

    expect(() => trackClaimSuccess(750, "trust-network")).not.toThrow();
    expect("gtag" in window).toBe(false);
  });

  it("should load events from localStorage on reload", () => {
    const mockEvents = [
      { timestamp: "2023-01-01T00:00:00.000Z", eventType: "testEvent", metadata: { test: true } },
    ];
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockEvents));

    const { events, unsubscribe } = collectEvents();
    analyticsStore.reloadFromStorage();

    expect(events).toEqual(mockEvents);

    unsubscribe();
  });

  it("should handle convenience functions correctly", () => {
    const { events, unsubscribe } = collectEvents();

    trackAttestationQuery(250);
    trackClaimAttempt(600, "web3-community");
    trackProofGenDuration("gated", false, 3000);

    expect(events.map((event) => (event as { eventType: string }).eventType)).toEqual([
      "attestationQuery",
      "claimAttempt",
      "proofGenDuration",
    ]);
    expect((events[0] as { metadata: unknown }).metadata).toEqual({ duration: 250 });
    expect((events[1] as { metadata: unknown }).metadata).toEqual({
      score: 600,
      community: "web3-community",
    });
    expect((events[2] as { metadata: unknown }).metadata).toEqual({
      proofType: "gated",
      anonymous: false,
      duration: 3000,
    });

    unsubscribe();
  });

  it("should not persist or call gtag in non-browser environment", () => {
    const originalWindow = global.window;
    const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).localStorage;

    const { events, unsubscribe } = collectEvents();

    trackProofGenStart("anonymous", true);

    expect(events).toHaveLength(1);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

    global.window = originalWindow;
    if (originalLocalStorage !== undefined) {
      (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
    }
    unsubscribe();
  });
});
