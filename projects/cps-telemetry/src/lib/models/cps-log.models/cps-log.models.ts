import {
  CpsRegistered,
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../cps-telemetry-common.models/cps-telemetry-common.models';

/**
 * Registry of this application's logger names.
 *
 * A logger name says which part of the application a record came from, and
 * selects its per-logger level. Declaring the vocabulary turns a typo'd
 * name into a compile error instead of a filter that silently never matches.
 *
 * @example
 * ```typescript
 * // src/app/telemetry.schema.ts
 * declare module 'cps-telemetry' {
 *   interface CpsLoggerNames {
 *     checkout: true;
 *     admin: true;
 *   }
 * }
 * export {};
 * ```
 *
 * @group Interfaces
 */
// Empty by design — see CpsScenarioNames in cps-scenario.models.ts.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CpsLoggerNames {}

/**
 * Every logger name this application declares.
 *
 * Resolves to `string` until {@link CpsLoggerNames} is augmented.
 *
 * @group Types
 */
export type CpsLoggerName = CpsRegistered<CpsLoggerNames>;

/**
 * Severity of a log record. Ordered: `log` < `warn` < `error`.
 *
 * @group Types
 */
export type CpsLogLevel = 'log' | 'warn' | 'error';

/**
 * Numeric ordering used to apply {@link CpsLogConfig.minLevel}.
 *
 * @group Types
 */
export const CPS_LOG_LEVEL_ORDER: Record<CpsLogLevel, number> = {
  log: 0,
  warn: 1,
  error: 2
};

/**
 * Optional per-call detail accepted by the logger.
 *
 * Every field is optional — `logger.log('message')` is a valid call.
 *
 * @group Interfaces
 */
export interface CpsLogDetail {
  /**
   * Which named logger this record belongs to, declared in
   * {@link CpsLoggerNames}. Bind it once with {@link CpsLoggerService.getLogger}
   * instead of passing it per call.
   */
  logger?: CpsLoggerName;

  /**
   * Free-form subsystem label, e.g. a service or component name, for
   * filtering logs without parsing the message. Scrubbed like `message`.
   */
  context?: string;

  /** Structured attributes. Redacted before leaving the browser. */
  metadata?: CpsTelemetryMetadata;

  /** Thrown value. Normalized via {@link cpsNormalizeError}. */
  error?: unknown;

  /**
   * Identifier joining this log line to other telemetry. Pass a
   * {@link CpsScenario.id} to correlate with scenario telemetry, or use
   * {@link CpsLoggerService.child} to bind it once.
   */
  correlationId?: string;
}

/**
 * The structured record handed to the application's {@link CpsLogApiProvider}.
 *
 * @group Interfaces
 */
export interface CpsLogRecord {
  /** ISO-8601 timestamp of the moment the log call was made. */
  timestamp: string;

  /** Severity. */
  level: CpsLogLevel;

  /** Human-readable message. Redacted and length-capped. */
  message: string;

  /** Named logger this record came from, when it came from one. */
  logger?: CpsLoggerName;

  /** Subsystem label, when supplied. Redacted and length-capped, like `message`. */
  context?: string;

  /** Redacted structured attributes, when supplied. */
  metadata?: CpsTelemetryMetadata;

  /** Normalized error, when supplied. */
  error?: CpsTelemetryError;

  /** Correlation identifier, when supplied. */
  correlationId?: string;

  /** Application name. */
  application: string;

  /** Deployment environment. */
  environment: string;

  /** Application version. */
  version: string;

  /** Application-supplied user identifier, when known. */
  userId?: string;

  /** Session identifier reported by the sink, when available. */
  sessionId?: string;
}
