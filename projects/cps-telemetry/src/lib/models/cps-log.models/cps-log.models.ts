import {
  CpsRegistered,
  CpsTelemetryAttribution,
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
   * {@link CpsScenario.id} here to tie this line to a scenario, and the
   * same id reaches {@link CpsLoggerService.query} to read the journey
   * back across every logger that wrote during it.
   */
  correlationId?: string;
}

/**
 * The structured record handed to the application's {@link CpsLogApiProvider}.
 *
 * @group Interfaces
 */
export interface CpsLogRecord
  extends Omit<CpsLogDetail, 'error'>, CpsTelemetryAttribution {
  /** ISO-8601 timestamp of the moment the log call was made. */
  timestamp: string;

  /** Severity. */
  level: CpsLogLevel;

  /** Human-readable message. Redacted and length-capped. */
  message: string;

  /** Named logger this record came from, when it came from one. */
  logger?: CpsLoggerName;

  /** Normalized error, when supplied. */
  error?: CpsTelemetryError;

  /** Deployment environment. */
  environment: string;

  /** Application version. */
  version: string;
}

/**
 * The application-facing logging API — what
 * {@link CpsLoggerService.getLogger} hands back, so application code holds
 * this contract without naming the service.
 *
 * An instance *is* its name. The name is fixed when the logger is created
 * and stamped on every record it writes, so a record's `logger` can never
 * disagree with the logger that produced it.
 *
 * @group Interfaces
 */
export interface CpsLogger {
  log(message: string, detail?: CpsLogDetail): void;
  warn(message: string, detail?: CpsLogDetail): void;
  error(message: string, detail?: CpsLogDetail): void;
}
