import { Injectable } from '@angular/core';
import { UwtLogRecord } from '../../models/uwt-log.models/uwt-log.models';
import {
  UwtLogApiProvider,
  UwtLogQuery
} from '../uwt-log-api.provider/uwt-log-api.provider';

/**
 * Log API provider that discards every record and finds none.
 *
 * The explicit way to say an application has no log backend — never a
 * default, like `provideUwtTelemetrySink('noop')`. Mostly for a shell that
 * hosts fragments with {@link provideUwtTelemetryBroadcastHost} but logs
 * nothing: the host requires a log provider, so that one can't be
 * forgotten.
 *
 * Bound in a shell, it discards its fragments' log records too.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: UWT_LOG_API_PROVIDER, useClass: UwtNoopLogApiProvider },
 *   provideUwtTelemetryBroadcastHost()
 * ]
 * ```
 *
 * @group Services
 */
@Injectable()
export class UwtNoopLogApiProvider implements UwtLogApiProvider {
  /** @inheritdoc */
  send(_record: UwtLogRecord): void {}

  /** @inheritdoc */
  query(_filter: UwtLogQuery): Promise<UwtLogRecord[]> {
    return Promise.resolve([]);
  }
}
