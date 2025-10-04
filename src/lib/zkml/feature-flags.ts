/**
 * Feature Flags for Quick Testing and Debugging
 *
 * Query parameter-based feature flags for controlling proof generation behavior:
 * - ?local=force - Force local WASM proving (skip device capability check)
 * - ?local=off - Force remote proving (skip local attempt entirely)
 * - ?simulation=true - Use simulation mode for testing without EZKL
 * - ?telemetry=off - Disable telemetry tracking
 *
 * Example URLs:
 * - http://localhost:5173/claim?local=force
 * - http://localhost:5173/claim?local=off
 * - http://localhost:5173/claim?simulation=true&telemetry=off
 */

export interface FeatureFlags {
  /** Force local WASM proving, skip device capability check */
  forceLocal: boolean;
  /** Force remote proving, skip local attempt */
  forceRemote: boolean;
  /** Use simulation mode instead of real EZKL */
  forceSimulation: boolean;
  /** Disable telemetry tracking */
  disableTelemetry: boolean;
}

/**
 * Parse feature flags from URL query parameters
 */
export function getFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") {
    return {
      forceLocal: false,
      forceRemote: false,
      forceSimulation: false,
      disableTelemetry: false,
    };
  }

  const params = new URLSearchParams(window.location.search);

  // Parse local flag
  const localFlag = params.get("local");
  const forceLocal = localFlag === "force";
  const forceRemote = localFlag === "off";

  // Parse simulation flag
  const simulationFlag = params.get("simulation");
  const forceSimulation = simulationFlag === "true" || simulationFlag === "1";

  // Parse telemetry flag
  const telemetryFlag = params.get("telemetry");
  const disableTelemetry = telemetryFlag === "off" || telemetryFlag === "false";

  return {
    forceLocal,
    forceRemote,
    forceSimulation,
    disableTelemetry,
  };
}

/**
 * Get a human-readable description of active feature flags
 */
export function getFeatureFlagDescription(): string {
  const flags = getFeatureFlags();
  const active: string[] = [];

  if (flags.forceLocal) active.push("Local proving forced");
  if (flags.forceRemote) active.push("Remote proving forced");
  if (flags.forceSimulation) active.push("Simulation mode");
  if (flags.disableTelemetry) active.push("Telemetry disabled");

  if (active.length === 0) {
    return "No feature flags active";
  }

  return `Active flags: ${active.join(", ")}`;
}

/**
 * Update URL with feature flag without page reload
 */
export function setFeatureFlag(key: string, value: string | null) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  if (value === null) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }

  window.history.replaceState({}, "", url.toString());
}
