import { InjectionToken } from '@angular/core';
import {
  UwtLoggerName,
  UwtLogLevel,
  UwtLogRecord
} from '../../models/uwt-log.models/uwt-log.models';

/**
 * Filter accepted by {@link UwtLoggerService.query}.
 *
 * Every field is optional and they combine with AND. A provider translates
 * them however its store requires.
 *
 * @group Interfaces
 */
export interface UwtLogQuery {
  /**
   * Pulls one journey's lines together. Pass a {@link UwtScenario.id} to read
   * everything logged during that scenario, across services.
   */
  correlationId?: string;

  /** Restricts to one named logger. */
  logger?: UwtLoggerName;

  /** Discards records below this severity. */
  minLevel?: UwtLogLevel;

  /** ISO-8601 lower bound on `timestamp`, inclusive. */
  from?: string;

  /** ISO-8601 upper bound on `timestamp`, inclusive. */
  to?: string;

  /** Maximum number of records to return. */
  limit?: number;
}

/**
 * The application's log store, as this library needs to see it.
 *
 * Where records are kept, how they are authorised and how long they are
 * retained are decisions for the consuming application; this is the seam it
 * supplies them through.
 *
 * @example
 * ```typescript
 * send(record: UwtLogRecord): void {
 *   this.http.post('/api/logs', record).subscribe({ error: () => undefined });
 * }
 *
 * query(filter: UwtLogQuery): Promise<UwtLogRecord[]> {
 *   return firstValueFrom(this.http.get<UwtLogRecord[]>('/api/logs', { params: { ...filter } }));
 * }
 * ```
 *
 * @group Interfaces
 */
export interface UwtLogApiProvider {
  /**
   * Ships one record.
   *
   * Called once per record, as it is written. Must be non-blocking and must
   * not throw. A provider that batches accumulates its own queue here and
   * flushes it via {@link flush}.
   *
   * @param record the redacted record
   */
  send(record: UwtLogRecord): void;

  /**
   * Reads records back.
   *
   * @param filter narrows what is returned; an empty filter means "everything
   *   this provider is willing to return"
   * @returns the matching records
   */
  query(filter: UwtLogQuery): Promise<UwtLogRecord[]>;

  /**
   * Ships whatever this provider is holding, if it holds anything.
   *
   * Optional; only needed by a provider that batches in {@link send} instead
   * of sending immediately.
   *
   * Called on `pagehide`, on `visibilitychange` going hidden, and on
   * teardown. Must be synchronous and non-blocking. `fetch` with `keepalive`
   * or `navigator.sendBeacon` are the usual choices.
   */
  flush?(): void;
}

/**
 * Binds the application's {@link UwtLogApiProvider}.
 *
 * Bound by the application; `provideUwtTelemetry` wires everything else.
 * Has no default — an unbound provider fails at injection rather than
 * silently discarding logs. To keep no logs, say so with
 * {@link UwtNoopLogApiProvider}.
 *
 * @group Tokens
 */
export const UWT_LOG_API_PROVIDER = new InjectionToken<UwtLogApiProvider>(
  'UWT_LOG_API_PROVIDER'
);
