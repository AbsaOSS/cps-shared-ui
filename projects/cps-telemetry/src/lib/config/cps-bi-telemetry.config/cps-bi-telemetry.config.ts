import { InjectionToken } from '@angular/core';

/**
 * Business and UX event tracking configuration.
 *
 * @group Interfaces
 */
export interface CpsBITelemetryConfig {
  /** Milliseconds within which an identical event is treated as a double-fire. */
  dedupWindowMs: number;

  /**
   * Distinct event keys tracked before expired ones are swept.
   *
   * Keyed per `eventName|scenarioId|eventType|feature|metadata`, which
   * grows unbounded over a long session without this cap.
   */
  dedupMaxKeys: number;

  /**
   * Whether redaction runs on BI events. On by default. Turning it off
   * skips only the *configurable* PII scrubbing (`extraKeyPatterns`,
   * value-pattern scanning, URL-query stripping) — the built-in credential
   * denylist, size caps, error normalization and any
   * `CpsRedactConfig.extraValueTransforms` still apply; see
   * {@link cpsRedactConfigFor}.
   */
  redact: boolean;
}

/** Default BI event tracking settings. */
export const CPS_DEFAULT_BI_TELEMETRY_CONFIG: CpsBITelemetryConfig = {
  dedupWindowMs: 400,
  dedupMaxKeys: 100,
  redact: true
};

/**
 * Resolved BI event configuration. Provided by {@link provideCpsTelemetry},
 * overridden with `withBIEvents(...)`.
 *
 * @group Tokens
 */
export const CPS_BI_TELEMETRY_CONFIG = new InjectionToken<CpsBITelemetryConfig>(
  'CPS_BI_TELEMETRY_CONFIG'
);
