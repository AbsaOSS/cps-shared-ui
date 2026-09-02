import { InjectionToken } from '@angular/core';

/**
 * Business and UX event tracking configuration.
 *
 * @group Interfaces
 */
export interface CpsBiConfig {
  /** Milliseconds within which an identical event is treated as a double-fire. */
  dedupWindowMs: number;

  /**
   * Distinct event keys tracked before expired ones are swept.
   *
   * Keyed per `eventName|scenarioId`, which grows unbounded over a long
   * session without this cap.
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
export const CPS_DEFAULT_BI_CONFIG: CpsBiConfig = {
  dedupWindowMs: 400,
  dedupMaxKeys: 100,
  redact: true
};

/**
 * Resolved BI event configuration. Provided by {@link provideCpsTelemetry},
 * overridden with `withBiEvents(...)`.
 *
 * @group Tokens
 */
export const CPS_BI_CONFIG = new InjectionToken<CpsBiConfig>('CPS_BI_CONFIG');
