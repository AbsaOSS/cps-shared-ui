import { Injectable } from '@angular/core';
import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';
import {
  CpsLogApiProvider,
  CpsLogQuery
} from '../cps-log-api.provider/cps-log-api.provider';

/**
 * Log API provider that discards every record and finds none.
 *
 * The explicit way to say an application has no log backend — never a
 * default, like `provideCpsTelemetrySink('noop')`. Mostly for a shell that
 * hosts fragments with {@link provideCpsTelemetryBroadcastHost} but logs
 * nothing: the host requires a log provider, so that one can't be
 * forgotten.
 *
 * Bound in a shell, it discards its fragments' log records too.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: CPS_LOG_API_PROVIDER, useClass: CpsNoopLogApiProvider },
 *   provideCpsTelemetryBroadcastHost()
 * ]
 * ```
 *
 * @group Services
 */
@Injectable()
export class CpsNoopLogApiProvider implements CpsLogApiProvider {
  /** @inheritdoc */
  send(_record: CpsLogRecord): void {}

  /** @inheritdoc */
  query(_filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    return Promise.resolve([]);
  }
}
