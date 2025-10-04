/**
 * Minimal Privacy-Safe Telemetry Module
 *
 * Tracks proof generation events without collecting PII
 * Events fire to dev console today; can be hooked to real sink later
 */

export interface ProofTelemetryEvent {
  /** Proof generation method: local WASM, remote server, or simulation */
  method: "local" | "remote" | "simulation";
  /** Duration in milliseconds */
  ms: number;
  /** Circuit size: 16, 32, 64, etc. */
  size: number;
  /** Device capabilities summary (no identifying info) */
  device: {
    /** Device type: desktop, mobile, tablet */
    type: "desktop" | "mobile" | "tablet" | "unknown";
    /** RAM category: low (<4GB), medium (4-8GB), high (>8GB) */
    ramCategory: "low" | "medium" | "high" | "unknown";
    /** Browser family (no version) */
    browser: "chrome" | "firefox" | "safari" | "edge" | "other";
    /** Whether WASM is supported */
    wasmSupported: boolean;
  };
  /** Timestamp of event (not user's timezone) */
  timestamp: number;
  /** Success or failure */
  success: boolean;
  /** Error type if failed (no stack traces) */
  errorType?: string;
}

export interface TelemetryConfig {
  /** Enable telemetry collection */
  enabled: boolean;
  /** Log to console in development */
  logToConsole: boolean;
  /** Custom sink function for production */
  sink?: (event: ProofTelemetryEvent) => void | Promise<void>;
}

class TelemetryManager {
  private config: TelemetryConfig = {
    enabled: true,
    logToConsole: true,
  };

  private events: ProofTelemetryEvent[] = [];
  private maxEvents = 100; // Keep last 100 events in memory

  /**
   * Configure telemetry settings
   */
  configure(config: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Track a proof generation event
   */
  trackProof(params: {
    method: "local" | "remote" | "simulation";
    ms: number;
    size: number;
    device?: Partial<ProofTelemetryEvent["device"]>;
    success?: boolean;
    errorType?: string;
  }): void {
    if (!this.config.enabled) return;

    const event: ProofTelemetryEvent = {
      method: params.method,
      ms: params.ms,
      size: params.size,
      device: {
        type: params.device?.type || this.detectDeviceType(),
        ramCategory: params.device?.ramCategory || this.detectRAMCategory(),
        browser: params.device?.browser || this.detectBrowser(),
        wasmSupported: params.device?.wasmSupported ?? this.detectWASMSupport(),
      },
      timestamp: Date.now(),
      success: params.success ?? true,
      errorType: params.errorType,
    };

    // Store in memory
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      console.log("[Telemetry] Proof event:", {
        method: event.method,
        duration: `${event.ms}ms`,
        size: event.size,
        device: event.device,
        success: event.success,
        ...(event.errorType && { error: event.errorType }),
      });
    }

    // Send to sink if configured
    if (this.config.sink) {
      try {
        this.config.sink(event);
      } catch (error) {
        console.error("[Telemetry] Sink error:", error);
      }
    }
  }

  /**
   * Get all stored events
   */
  getEvents(): ProofTelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Clear all stored events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Get aggregated statistics
   */
  getStats(): {
    totalProofs: number;
    successRate: number;
    avgDuration: number;
    methodBreakdown: Record<string, number>;
    deviceBreakdown: Record<string, number>;
  } {
    if (this.events.length === 0) {
      return {
        totalProofs: 0,
        successRate: 0,
        avgDuration: 0,
        methodBreakdown: {},
        deviceBreakdown: {},
      };
    }

    const successful = this.events.filter((e) => e.success).length;
    const totalDuration = this.events.reduce((sum, e) => sum + e.ms, 0);

    const methodBreakdown: Record<string, number> = {};
    const deviceBreakdown: Record<string, number> = {};

    for (const event of this.events) {
      methodBreakdown[event.method] = (methodBreakdown[event.method] || 0) + 1;
      deviceBreakdown[event.device.type] = (deviceBreakdown[event.device.type] || 0) + 1;
    }

    return {
      totalProofs: this.events.length,
      successRate: successful / this.events.length,
      avgDuration: totalDuration / this.events.length,
      methodBreakdown,
      deviceBreakdown,
    };
  }

  /**
   * Detect device type from user agent (no PII)
   */
  private detectDeviceType(): ProofTelemetryEvent["device"]["type"] {
    if (typeof navigator === "undefined") return "unknown";

    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/.test(ua)) return "mobile";
    if (/tablet|ipad/.test(ua)) return "tablet";
    return "desktop";
  }

  /**
   * Detect RAM category (no exact value)
   */
  private detectRAMCategory(): ProofTelemetryEvent["device"]["ramCategory"] {
    if (typeof navigator === "undefined") return "unknown";

    // @ts-ignore - navigator.deviceMemory is not in all browsers
    const deviceMemory = navigator.deviceMemory;
    if (typeof deviceMemory !== "number") return "unknown";

    if (deviceMemory < 4) return "low";
    if (deviceMemory <= 8) return "medium";
    return "high";
  }

  /**
   * Detect browser family (no version)
   */
  private detectBrowser(): ProofTelemetryEvent["device"]["browser"] {
    if (typeof navigator === "undefined") return "other";

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg")) return "edge";
    if (ua.includes("chrome")) return "chrome";
    if (ua.includes("firefox")) return "firefox";
    if (ua.includes("safari")) return "safari";
    return "other";
  }

  /**
   * Detect WASM support
   */
  private detectWASMSupport(): boolean {
    try {
      if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
        const module = new WebAssembly.Module(
          Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
        );
        if (module instanceof WebAssembly.Module) {
          return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }
}

// Export singleton instance
export const telemetry = new TelemetryManager();

// Convenience function for tracking proof events
export const trackProof = telemetry.trackProof.bind(telemetry);
