import { InjectionToken } from '@angular/core';

/**
 * Scenario telemetry configuration.
 *
 * @group Interfaces
 */
export interface UwtScenarioTelemetryConfig {
  /**
   * Milliseconds after which an unsettled scenario auto-settles as `timeout`.
   * `0` disables the default; individual scenarios can still opt in.
   */
  defaultTimeoutMs: number;

  /**
   * Emit an event per lifecycle transition instead of one packed event at
   * settlement. Off by default.
   *
   * Counts against the RUM session's shared `sessionEventLimit` (200 by
   * default). Suited to local debugging, not production traffic.
   *
   * Also governs per-step `debugScenario` console output, because the
   * console prints one line per event actually sent and nothing else.
   * With this off, a scenario prints a single line at settlement — the
   * one record it sends.
   */
  emitLifecycleEvents: boolean;

  /**
   * Maximum number of steps retained per scenario. Further steps are counted in
   * `stepCount` but not stored, bounding the payload of a runaway loop.
   */
  maxSteps: number;

  /**
   * Mirror scenario and step boundaries into `performance.mark` / `measure`,
   * visible on the DevTools Performance track. Off by default.
   *
   * The `debugScenario` LocalStorage flag switches them on regardless of this
   * setting. Marks are cleared when a scenario settles; see
   * {@link markCleanupFallbackMs} for scenarios that never do.
   */
  userTimings: boolean;

  /**
   * How long in milliseconds an unsettled scenario's User Timing marks can
   * remain in the Performance buffer before a fallback clears them.
   *
   * Only applies when `userTimings` is enabled and `timeoutMs: 0`. `0`
   * disables the fallback, so marks accumulate for the page's lifetime.
   */
  markCleanupFallbackMs: number;

  /**
   * Whether redaction runs on scenario records. On by default. Turning it
   * off skips only the *configurable* PII scrubbing (`extraKeyPatterns`,
   * value-pattern scanning, URL-query stripping) — the built-in credential
   * denylist, size caps, error normalization and any
   * `UwtRedactConfig.extraValueTransforms` still apply; see
   * {@link uwtRedactConfigFor}.
   */
  redact: boolean;
}

/** Default scenario telemetry settings. */
export const UWT_DEFAULT_SCENARIO_TELEMETRY_CONFIG: UwtScenarioTelemetryConfig =
  {
    defaultTimeoutMs: 30_000,
    emitLifecycleEvents: false,
    maxSteps: 50,
    userTimings: false,
    markCleanupFallbackMs: 300_000,
    redact: true
  };

/**
 * Resolved scenario telemetry configuration. Provided by
 * {@link provideUwtTelemetry}, overridden with `withScenarios(...)`.
 *
 * @group Tokens
 */
export const UWT_SCENARIO_TELEMETRY_CONFIG =
  new InjectionToken<UwtScenarioTelemetryConfig>(
    'UWT_SCENARIO_TELEMETRY_CONFIG'
  );
