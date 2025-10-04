/**
 * Device Capability Detection for deterministic routing
 * Determines whether to use local EZKL WASM or remote proving based on device specs
 */

export interface DeviceCapabilities {
  canRunLocal: boolean;
  ram: number | null; // GB
  isLowPower: boolean;
  browser: string;
  reason: string;
}

export interface ProofRoutingPolicy {
  maxLocalOpinions: number;
  minRAM: number; // GB
  blockedBrowsers: string[];
}

const DEFAULT_POLICY: ProofRoutingPolicy = {
  maxLocalOpinions: 32,
  minRAM: 4, // 4GB
  blockedBrowsers: ["Safari", "iOS"],
};

class DeviceCapabilityDetector {
  private policy: ProofRoutingPolicy;

  constructor(policy: ProofRoutingPolicy = DEFAULT_POLICY) {
    this.policy = policy;
  }

  /**
   * Detect device capabilities
   */
  detect(): DeviceCapabilities {
    const ram = this.detectRAM();
    const browser = this.detectBrowser();
    const isLowPower = this.isLowPowerDevice();

    // Check if browser is blocked (iOS Safari, etc.)
    const isBrowserBlocked = this.policy.blockedBrowsers.some((blocked) =>
      browser.includes(blocked)
    );

    // Determine if local proving is viable
    let canRunLocal = true;
    let reason = "Device meets requirements for local proving";

    if (isBrowserBlocked) {
      canRunLocal = false;
      reason = `Browser ${browser} not supported for local WASM proving`;
    } else if (ram !== null && ram < this.policy.minRAM) {
      canRunLocal = false;
      reason = `Insufficient RAM: ${ram}GB (required: ${this.policy.minRAM}GB)`;
    } else if (isLowPower) {
      canRunLocal = false;
      reason = "Low-power device detected, using remote prover";
    }

    return {
      canRunLocal,
      ram,
      isLowPower,
      browser,
      reason,
    };
  }

  /**
   * Determine if a proof with given opinion count should use local proving
   */
  shouldUseLocal(opinionCount: number): { useLocal: boolean; reason: string } {
    const capabilities = this.detect();

    if (!capabilities.canRunLocal) {
      return {
        useLocal: false,
        reason: capabilities.reason,
      };
    }

    if (opinionCount > this.policy.maxLocalOpinions) {
      return {
        useLocal: false,
        reason: `Opinion count ${opinionCount} exceeds local limit (${this.policy.maxLocalOpinions})`,
      };
    }

    return {
      useLocal: true,
      reason: "Device capable of local proving",
    };
  }

  /**
   * Detect available RAM (if available)
   */
  private detectRAM(): number | null {
    // @ts-ignore - navigator.deviceMemory is experimental
    if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
      // @ts-ignore
      return navigator.deviceMemory as number; // Returns GB
    }
    return null; // Unknown
  }

  /**
   * Detect browser/user agent
   */
  private detectBrowser(): string {
    if (typeof navigator === "undefined") return "Unknown";

    const ua = navigator.userAgent;

    // Check for iOS Safari
    if (/iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
      return "iOS Safari";
    }

    // Check for Safari (desktop)
    if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
      return "Safari";
    }

    // Check for Chrome
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) {
      return "Chrome";
    }

    // Check for Edge
    if (/Edg/.test(ua)) {
      return "Edge";
    }

    // Check for Firefox
    if (/Firefox/.test(ua)) {
      return "Firefox";
    }

    return "Unknown";
  }

  /**
   * Detect if device is low-power (mobile, tablet)
   */
  private isLowPowerDevice(): boolean {
    if (typeof navigator === "undefined") return false;

    const ua = navigator.userAgent;

    // Check for mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // Check for tablet
    const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);

    return isMobile || isTablet;
  }

  /**
   * Update routing policy
   */
  updatePolicy(policy: Partial<ProofRoutingPolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  /**
   * Get current policy
   */
  getPolicy(): ProofRoutingPolicy {
    return { ...this.policy };
  }
}

// Export singleton instance
export const deviceCapability = new DeviceCapabilityDetector();

/**
 * Get a human-readable capability message for UI display
 */
export function getCapabilityMessage(capabilities: DeviceCapabilities): string {
  if (!capabilities.canRunLocal) {
    return `Using remote prover (${capabilities.reason})`;
  }
  return "Local WASM proving available";
}
