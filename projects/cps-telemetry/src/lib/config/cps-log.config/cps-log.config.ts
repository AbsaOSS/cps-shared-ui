import { InjectionToken } from '@angular/core';
import {
  CpsLoggerName,
  CpsLogLevel
} from '../../models/cps-log.models/cps-log.models';

/**
 * Application logging configuration.
 *
 * @group Interfaces
 */
export interface CpsLogConfig {
  /** Records below this severity are discarded. */
  minLevel: CpsLogLevel;

  /**
   * Per-logger overrides of {@link minLevel}, keyed by logger name. Loggers
   * without an override use {@link minLevel}.
   *
   * ```typescript
   * withLogging({ minLevel: 'warn', levels: { checkout: 'log' } })
   * ```
   */
  levels?: Partial<Record<CpsLoggerName, CpsLogLevel>>;

  /**
   * Also report `logger.error` calls to the telemetry sink as RUM errors. Off
   * by default; competes for the same session event budget as scenario and
   * BI data.
   *
   * Mirrors `detail.error` when supplied; a message-only call builds a
   * synthetic `Error` from the redacted message text instead.
   */
  mirrorErrorsToRum: boolean;

  /**
   * Whether redaction runs on log records. On by default. Turning it off
   * skips only the *configurable* PII scrubbing (`extraKeyPatterns`,
   * value-pattern scanning, URL-query stripping) — the built-in credential
   * denylist, size caps, error normalization and any
   * `CpsRedactConfig.extraValueTransforms` still apply; see
   * {@link cpsRedactConfigFor}.
   */
  redact: boolean;
}

/** Default application logging settings. */
export const CPS_DEFAULT_LOG_CONFIG: CpsLogConfig = {
  minLevel: 'log',
  mirrorErrorsToRum: false,
  redact: true
};

/**
 * Resolved logging configuration. Provided by {@link provideCpsTelemetry},
 * overridden with `withLogging(...)`.
 *
 * @group Tokens
 */
export const CPS_LOG_CONFIG = new InjectionToken<CpsLogConfig>(
  'CPS_LOG_CONFIG'
);
