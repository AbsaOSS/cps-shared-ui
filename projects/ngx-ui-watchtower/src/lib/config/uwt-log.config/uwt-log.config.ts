import { InjectionToken } from '@angular/core';
import {
  UwtLoggerName,
  UwtLogLevel
} from '../../models/uwt-log.models/uwt-log.models';

/**
 * Application logging configuration.
 *
 * @group Interfaces
 */
export interface UwtLogConfig {
  /** Records below this severity are discarded. */
  minLevel: UwtLogLevel;

  /**
   * Per-logger overrides of {@link minLevel}, keyed by logger name. Loggers
   * without an override use {@link minLevel}.
   *
   * ```typescript
   * withLogging({ minLevel: 'warn', levels: { checkout: 'log' } })
   * ```
   */
  levels?: Partial<Record<UwtLoggerName, UwtLogLevel>>;

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
   * `UwtRedactConfig.extraValueTransforms` still apply; see
   * {@link uwtRedactConfigFor}.
   */
  redact: boolean;
}

/** Default application logging settings. */
export const UWT_DEFAULT_LOG_CONFIG: UwtLogConfig = {
  minLevel: 'log',
  mirrorErrorsToRum: false,
  redact: true
};

/**
 * Resolved logging configuration. Provided by {@link provideUwtTelemetry},
 * overridden with `withLogging(...)`.
 *
 * @group Tokens
 */
export const UWT_LOG_CONFIG = new InjectionToken<UwtLogConfig>(
  'UWT_LOG_CONFIG'
);
