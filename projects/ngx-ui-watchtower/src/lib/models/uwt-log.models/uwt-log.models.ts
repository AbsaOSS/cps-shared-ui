import {
  UwtRegistered,
  UwtTelemetryAttribution,
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../uwt-telemetry-common.models/uwt-telemetry-common.models';

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
 * declare module '@absaoss-cps/ngx-ui-watchtower' {
 *   interface UwtLoggerNames {
 *     checkout: true;
 *     admin: true;
 *   }
 * }
 * export {};
 * ```
 *
 * @group Interfaces
 */
// Empty by design — see UwtScenarioNames in uwt-scenario.models.ts.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UwtLoggerNames {}

/**
 * Every logger name this application declares.
 *
 * Resolves to `string` until {@link UwtLoggerNames} is augmented.
 *
 * @group Types
 */
export type UwtLoggerName = UwtRegistered<UwtLoggerNames>;

/**
 * Severity of a log record. Ordered: `log` < `warn` < `error`.
 *
 * @group Types
 */
export type UwtLogLevel = 'log' | 'warn' | 'error';

/**
 * Numeric ordering used to apply {@link UwtLogConfig.minLevel}.
 *
 * @group Types
 */
export const UWT_LOG_LEVEL_ORDER: Record<UwtLogLevel, number> = {
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
export interface UwtLogDetail {
  /**
   * Free-form subsystem label, e.g. a service or component name, for
   * filtering logs without parsing the message. Scrubbed like `message`.
   */
  context?: string;

  /** Structured attributes. Redacted before leaving the browser. */
  metadata?: UwtTelemetryMetadata;

  /** Thrown value. Normalized via {@link uwtNormalizeError}. */
  error?: unknown;

  /**
   * Identifier joining this log line to other telemetry. Pass a
   * {@link UwtScenario.id} here to tie this line to a scenario, and the
   * same id reaches {@link UwtLoggerService.query} to read the journey
   * back across every logger that wrote during it.
   */
  correlationId?: string;
}

/**
 * The structured record handed to the application's {@link UwtLogApiProvider}.
 *
 * @group Interfaces
 */
export interface UwtLogRecord
  extends Omit<UwtLogDetail, 'error'>, UwtTelemetryAttribution {
  /** ISO-8601 timestamp of the moment the log call was made. */
  timestamp: string;

  /** Severity. */
  level: UwtLogLevel;

  /** Human-readable message. Redacted and length-capped. */
  message: string;

  /** Named logger this record came from, when it came from one. */
  logger?: UwtLoggerName;

  /** Normalized error, when supplied. */
  error?: UwtTelemetryError;

  /** Deployment environment. */
  environment: string;

  /** Application version. */
  version: string;
}

/**
 * The application-facing logging API — what
 * {@link UwtLoggerService.getLogger} hands back, so application code holds
 * this contract without naming the service.
 *
 * An instance *is* its name. The name is fixed when the logger is created
 * and stamped on every record it writes, so a record's `logger` can never
 * disagree with the logger that produced it.
 *
 * @group Interfaces
 */
export interface UwtLogger {
  log(message: string, detail?: UwtLogDetail): void;
  warn(message: string, detail?: UwtLogDetail): void;
  error(message: string, detail?: UwtLogDetail): void;
}
