import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';
import {
  CpsLogApiProvider,
  CpsLogQuery
} from '../cps-log-api.provider/cps-log-api.provider';
import {
  cpsSafeVoid,
  cpsUuid
} from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
import {
  CpsBroadcastConnection,
  cpsConnectBroadcastChannel,
  cpsIsBroadcastLogRecord,
  cpsIsBroadcastMessage
} from '../../sinks/cps-broadcast/cps-broadcast.messages';

/**
 * How long a follower waits for the host to answer a log query before
 * resolving to `[]`, in milliseconds.
 */
export const CPS_BROADCAST_LOG_QUERY_TIMEOUT_MS = 10_000;

/** A log query waiting for the host's answer. */
interface CpsPendingLogQuery {
  resolve: (records: CpsLogRecord[]) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Log API provider for a follower realm — the log counterpart of
 * {@link CpsBroadcastTelemetrySink}.
 *
 * Ships nothing itself. Records are forwarded over the `BroadcastChannel`
 * to the realm running {@link provideCpsTelemetryBroadcastHost}, which hands
 * them to its own {@link CPS_LOG_API_PROVIDER}: one log backend, one set of
 * credentials, for the whole composed page. Bound by
 * `provideCpsTelemetrySink('broadcast')`.
 *
 * `query()` is answered by the host's provider too. It resolves to `[]`
 * when no host answers within {@link CPS_BROADCAST_LOG_QUERY_TIMEOUT_MS},
 * and at once when no channel could be opened. The timeout runs outside
 * Angular's zone, so a query no host answers doesn't hold the application
 * unstable for its whole length.
 *
 * @group Services
 */
@Injectable()
export class CpsBroadcastLogApiProvider
  implements CpsLogApiProvider, OnDestroy
{
  private readonly connection: CpsBroadcastConnection =
    cpsConnectBroadcastChannel('broadcastLogApi');

  private readonly pending = new Map<string, CpsPendingLogQuery>();

  /** Absent outside an application, e.g. a bare `Injector.create`. */
  private readonly zone = inject(NgZone, { optional: true });

  constructor() {
    this.connection.onMessage((data) => this.onMessage(data));
  }

  /** @inheritdoc */
  send(record: CpsLogRecord): void {
    this.connection.post({ kind: 'log', record });
  }

  /** @inheritdoc */
  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    if (!this.connection.isOpen()) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const id = cpsUuid();
      const timer = this.outsideZone(() =>
        setTimeout(
          () => this.answer(id, []),
          CPS_BROADCAST_LOG_QUERY_TIMEOUT_MS
        )
      );
      this.pending.set(id, { resolve, timer });
      this.connection.post({ kind: 'log-query', id, filter });
    });
  }

  /** @inheritdoc */
  flush(): void {
    this.connection.post({ kind: 'log-flush' });
  }

  /** Resolves every unanswered query to `[]`, then closes the channel. */
  ngOnDestroy(): void {
    for (const id of [...this.pending.keys()]) {
      this.answer(id, []);
    }
    this.connection.close();
  }

  private onMessage(data: unknown): void {
    cpsSafeVoid('broadcastLogApi.receive', () => {
      if (!cpsIsBroadcastMessage(data) || data.kind !== 'log-query-result') {
        return;
      }
      // Other followers' answers arrive here too; answer() ignores them.
      this.answer(data.id, data.records.filter(cpsIsBroadcastLogRecord));
    });
  }

  private answer(id: string, records: CpsLogRecord[]): void {
    const query = this.pending.get(id);
    if (!query) {
      return;
    }
    this.pending.delete(id);
    clearTimeout(query.timer);
    if (this.zone) {
      this.zone.run(() => query.resolve(records));
    } else {
      query.resolve(records);
    }
  }

  private outsideZone<T>(fn: () => T): T {
    return this.zone ? this.zone.runOutsideAngular(fn) : fn();
  }
}
