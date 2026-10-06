import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { UwtLogRecord } from '../../models/uwt-log.models/uwt-log.models';
import {
  UwtLogApiProvider,
  UwtLogQuery
} from '../uwt-log-api.provider/uwt-log-api.provider';
import {
  uwtSafeVoid,
  uwtUuid
} from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';
import {
  UwtBroadcastConnection,
  uwtConnectBroadcastChannel,
  uwtIsBroadcastLogRecord,
  uwtIsBroadcastMessage
} from '../../sinks/uwt-broadcast/uwt-broadcast.messages';

/**
 * How long a follower waits for the host to answer a log query before
 * resolving to `[]`, in milliseconds.
 */
export const UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS = 10_000;

/** A log query waiting for the host's answer. */
interface UwtPendingLogQuery {
  resolve: (records: UwtLogRecord[]) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Log API provider for a follower realm — the log counterpart of
 * {@link UwtBroadcastTelemetrySink}.
 *
 * Ships nothing itself. Records are forwarded over the `BroadcastChannel`
 * to the realm running {@link provideUwtTelemetryBroadcastHost}, which hands
 * them to its own {@link UWT_LOG_API_PROVIDER}: one log backend, one set of
 * credentials, for the whole composed page. Bound by
 * `provideUwtTelemetrySink('broadcast')`.
 *
 * `query()` is answered by the host's provider too. It resolves to `[]`
 * when no host answers within {@link UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS},
 * and at once when no channel could be opened. The timeout runs outside
 * Angular's zone, so a query no host answers doesn't hold the application
 * unstable for its whole length.
 *
 * @group Services
 */
@Injectable()
export class UwtBroadcastLogApiProvider
  implements UwtLogApiProvider, OnDestroy
{
  private readonly connection: UwtBroadcastConnection =
    uwtConnectBroadcastChannel('broadcastLogApi');

  private readonly pending = new Map<string, UwtPendingLogQuery>();

  /** Absent outside an application, e.g. a bare `Injector.create`. */
  private readonly zone = inject(NgZone, { optional: true });

  constructor() {
    this.connection.onMessage((data) => this.onMessage(data));
  }

  /** @inheritdoc */
  send(record: UwtLogRecord): void {
    this.connection.post({ kind: 'log', record });
  }

  /** @inheritdoc */
  query(filter: UwtLogQuery): Promise<UwtLogRecord[]> {
    if (!this.connection.isOpen()) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const id = uwtUuid();
      const timer = this.outsideZone(() =>
        setTimeout(
          () => this.answer(id, []),
          UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS
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
    uwtSafeVoid('broadcastLogApi.receive', () => {
      if (!uwtIsBroadcastMessage(data) || data.kind !== 'log-query-result') {
        return;
      }
      // Other followers' answers arrive here too; answer() ignores them.
      this.answer(data.id, data.records.filter(uwtIsBroadcastLogRecord));
    });
  }

  private answer(id: string, records: UwtLogRecord[]): void {
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
