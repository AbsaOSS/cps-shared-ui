import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  cpsSafe,
  cpsSafeVoid,
  cpsSafeVoidMaybeAsync
} from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
import {
  CpsBroadcastConnection,
  cpsConnectBroadcastChannel,
  cpsElectBroadcastHostLeader,
  cpsIsBroadcastMessage
} from './cps-broadcast.messages';
import { CpsTelemetrySink } from '../cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { cpsClassifyTelemetryEvent } from '../../utils/cps-telemetry-event.util/cps-telemetry-event.util';
import { CpsBroadcastTelemetrySink } from './cps-broadcast-telemetry.sink';
import { CpsBroadcastLogApiProvider } from '../../providers/cps-broadcast-log-api.provider/cps-broadcast-log-api.provider';
import { CpsTelemetryMonitor } from '../../services/cps-telemetry-monitor.service/cps-telemetry-monitor.service';
import {
  CpsJsonObject,
  CpsTelemetryEventOrigin
} from '../../models/cps-telemetry-monitor.models/cps-telemetry-monitor.models';
import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogQuery
} from '../../providers/cps-log-api.provider/cps-log-api.provider';

/**
 * Active host count per channel, scoped to this JS realm — distinguishes a
 * true duplicate provider from another tab sharing the same channel.
 */
const hostsInThisRealm = new Map<string, number>();

/**
 * A forwarded error-level log record, kept for exactly one message in case
 * the next is its `mirrorErrorsToRum` copy.
 */
interface CpsForwardedErrorLog {
  application: string;
  expected: CpsTelemetryError;
  sequence: number;
}

/**
 * Receives telemetry forwarded by follower realms and records it through this
 * realm's sink.
 *
 * Runs in the shell, the realm with the real sink. Fragments using
 * {@link CpsBroadcastTelemetrySink} post their events here, so one AWS client,
 * one session and one event budget serve the whole composed page.
 *
 * Fragments' log records arrive the same way, from
 * {@link CpsBroadcastLogApiProvider}, and go to this realm's
 * {@link CPS_LOG_API_PROVIDER} — which also answers their `query()` calls.
 * The provider is required: a shell hosting fragments without one fails at
 * injection, rather than silently discarding their logs.
 *
 * A realm that forwards its own telemetry — `provideCpsTelemetrySink('broadcast')`
 * — cannot also host it: the host would receive its own realm's messages
 * and forward them again, forever. Such a host warns and stays inactive.
 *
 * A Web Locks-based election ({@link cpsElectBroadcastHostLeader}) keeps
 * exactly one host active per channel; others stay passive.
 *
 * @example
 * ```typescript
 * import { provideCpsTelemetryRumSink } from 'cps-telemetry/rum';
 *
 * providers: [
 *   provideCpsTelemetry({ application: 'shell', environment: 'prod', version: '1.0.0' }),
 *   provideCpsTelemetryRumSink(),
 *   { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend },
 *   provideCpsTelemetryBroadcastHost()
 * ]
 * ```
 *
 * @group Services
 */
@Injectable()
export class CpsTelemetryBroadcastHost implements OnDestroy {
  private readonly sink = inject(CpsTelemetrySink);
  private readonly monitor = inject(CpsTelemetryMonitor);
  private readonly logApi = inject(CPS_LOG_API_PROVIDER);
  private readonly connection: CpsBroadcastConnection =
    cpsConnectBroadcastChannel('broadcastHost');

  /** Number of messages accepted, for tests and diagnostics. */
  private _received = 0;

  /**
   * The session and user id last sent in an `identity` message.
   *
   * Compared against the sink's current values on every follower activity, so
   * a late-resolving session id or user id gets announced once it exists.
   */
  private lastAnnouncedSessionId?: string;
  private lastAnnouncedUserId?: string;

  /** Whether this realm won the leader election; non-leaders stay passive. */
  private isLeader = false;
  private releaseLeadership: () => void = () => undefined;

  /** The last message, when it was an error-level log record. */
  private lastErrorLog?: CpsForwardedErrorLog;

  constructor() {
    this.warnIfDuplicateInThisRealm();
    if (this.forwardsItsOwnRealm()) {
      this.connection.close();
      return;
    }

    this.connection.onMessage((data) => this.onMessage(data));
    this.releaseLeadership = cpsElectBroadcastHostLeader(
      this.connection.channelName,
      () => {
        this.isLeader = true;
        this.announceIdentity();
      }
    );
  }

  /** How many follower messages have been accepted. */
  get received(): number {
    return this._received;
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    this.forgetInThisRealm();
    this.releaseLeadership();
    this.connection.close();
  }

  private onMessage(data: unknown): void {
    cpsSafeVoid('broadcastHost.receive', () => {
      if (!this.isLeader || !cpsIsBroadcastMessage(data)) {
        return;
      }

      if (
        data.kind !== 'identity' &&
        data.kind !== 'identity-request' &&
        data.kind !== 'log-query-result'
      ) {
        this._received++;
      }

      // A mirror arrives straight after its log record, so the candidate
      // lives for one message only.
      const errorLog = this.lastErrorLog;
      this.lastErrorLog = undefined;

      switch (data.kind) {
        case 'event':
          this.sink.record(data.eventType, data.payload, data.metadata);
          this.monitor.publish({
            kind: cpsClassifyTelemetryEvent(data.eventType, data.payload).kind,
            eventType: data.eventType,
            payload: data.payload as CpsJsonObject,
            destination: 'sink',
            origin: forwardedFrom(data.metadata?.application)
          });
          this.reannounceIfIdentityChanged();
          break;
        case 'error':
          this.sink.recordError(data.error, data.metadata);
          this.monitor.publish({
            kind: 'error',
            payload: data.error,
            ...(errorLog &&
              isMirrorOf(errorLog, data.error, data.metadata) && {
                relatedSequence: errorLog.sequence
              }),
            destination: 'sink',
            origin: forwardedFrom(data.metadata?.application)
          });
          this.reannounceIfIdentityChanged();
          break;
        case 'user':
          this.sink.setUserId(data.userId);
          this.announceIdentity();
          break;
        case 'flush':
          this.sink.flush(data.beacon);
          this.reannounceIfIdentityChanged();
          break;
        case 'identity-request':
          this.announceIdentity();
          break;
        case 'identity':
          // Another realm's host on this origin-wide channel — expected,
          // not a problem. Same-document duplicates are caught by
          // warnIfDuplicateInThisRealm() instead.
          break;
        case 'log':
          this.deliverLog(data.record);
          this.reannounceIfIdentityChanged();
          break;
        case 'log-flush':
          cpsSafeVoidMaybeAsync('broadcastHost.logFlush', () =>
            this.logApi?.flush?.()
          );
          break;
        case 'log-query':
          this.answerLogQuery(data.id, data.filter);
          break;
        case 'log-query-result':
          // Hosts answer queries; they never ask them.
          break;
      }
    });
  }

  /**
   * Hands a follower's record to this realm's log API provider, and tells
   * the monitor once it has — as {@link CpsLoggerService} does for its own.
   */
  private deliverLog(record: CpsLogRecord): void {
    cpsSafeVoidMaybeAsync('broadcastHost.log', () => {
      const pending = this.logApi.send(record);
      const sequence = this.monitor.publish({
        kind: 'log',
        payload: record,
        destination: 'log-provider',
        origin: forwardedFrom(record.application)
      });
      if (record.level === 'error' && sequence !== undefined) {
        this.lastErrorLog = {
          application: record.application,
          // What CpsLoggerService mirrors to RUM for this record.
          expected: record.error ?? { name: 'Error', message: record.message },
          sequence
        };
      }
      return pending;
    });
  }

  /**
   * Answers a follower's query from this realm's log API provider. Always
   * answers — `[]` when there is no provider or it fails — so the follower
   * isn't left waiting for its timeout.
   */
  private answerLogQuery(id: string, filter: CpsLogQuery): void {
    const reply = (records: unknown) =>
      this.connection.post({
        kind: 'log-query-result',
        id,
        records: Array.isArray(records) ? records : []
      });

    const pending = cpsSafe(
      'broadcastHost.logQuery',
      () => this.logApi.query(filter),
      undefined
    );

    if (!pending) {
      reply([]);
      return;
    }
    // Promise.resolve: a provider breaking its contract with a plain value
    // still gets an answer out.
    Promise.resolve(pending).then(reply, () => reply([]));
  }

  /**
   * Whether this realm's own sink or log provider forwards over the
   * channel. Hosting then would loop: the host receives its own realm's
   * messages and hands them straight back to the channel.
   */
  private forwardsItsOwnRealm(): boolean {
    const forwards =
      this.sink instanceof CpsBroadcastTelemetrySink ||
      this.logApi instanceof CpsBroadcastLogApiProvider;

    if (forwards) {
      cpsSafeVoid('broadcastHost.forwardingRealmWarning', () => {
        console.warn(
          `[cps-telemetry] this realm forwards its own telemetry on channel "${this.connection.channelName}", so it cannot also host it; the host stays inactive. Provide the host only in the realm with the real sink and log provider`
        );
      });
    }
    return forwards;
  }

  /**
   * Warns when another host is already active on the same channel in this
   * realm — a real misconfiguration. Not based on the `identity` broadcast,
   * which can't distinguish this from a different, legitimate tab.
   */
  private warnIfDuplicateInThisRealm(): void {
    const channelName = this.connection.channelName;
    const activeCount = hostsInThisRealm.get(channelName) ?? 0;

    if (activeCount > 0) {
      cpsSafeVoid('broadcastHost.duplicateWarning', () => {
        console.warn(
          `[cps-telemetry] a second telemetry host is active on channel "${channelName}" in this document; only one realm should provide it`
        );
      });
    }

    hostsInThisRealm.set(channelName, activeCount + 1);
  }

  /** Releases this host's slot in {@link hostsInThisRealm}. */
  private forgetInThisRealm(): void {
    const channelName = this.connection.channelName;
    const activeCount = hostsInThisRealm.get(channelName) ?? 0;

    if (activeCount <= 1) {
      hostsInThisRealm.delete(channelName);
    } else {
      hostsInThisRealm.set(channelName, activeCount - 1);
    }
  }

  private announceIdentity(): void {
    const sessionId = this.currentSessionId();
    const userId = this.currentUserId();
    this.lastAnnouncedSessionId = sessionId;
    this.lastAnnouncedUserId = userId;
    this.connection.post({ kind: 'identity', sessionId, userId });
  }

  /**
   * Re-announces identity when the sink's session id or user id has moved on
   * from what followers were last told.
   */
  private reannounceIfIdentityChanged(): void {
    if (
      this.currentSessionId() !== this.lastAnnouncedSessionId ||
      this.currentUserId() !== this.lastAnnouncedUserId
    ) {
      this.announceIdentity();
    }
  }

  private currentSessionId(): string | undefined {
    return cpsSafe(
      'broadcastHost.getSessionId',
      () => this.sink.getSessionId(),
      undefined
    );
  }

  private currentUserId(): string | undefined {
    return cpsSafe(
      'broadcastHost.getUserId',
      () => this.sink.getUserId(),
      undefined
    );
  }
}

/**
 * Whether a forwarded error is the `mirrorErrorsToRum` copy of the error-level
 * log record just before it: same realm, same name and message. A mirror
 * the logger had to rewrite simply goes unlinked.
 */
function isMirrorOf(
  errorLog: CpsForwardedErrorLog,
  error: CpsTelemetryError,
  metadata: CpsTelemetryMetadata | undefined
): boolean {
  return (
    metadata?.application === errorLog.application &&
    error.name === errorLog.expected.name &&
    error.message === errorLog.expected.message
  );
}

/**
 * The forwarding realm: the `application` a follower sink stamps onto
 * metadata, or a log record's own.
 */
function forwardedFrom(
  application: CpsTelemetryMetadata[string] | undefined
): CpsTelemetryEventOrigin {
  return typeof application === 'string'
    ? { forwarded: true, application }
    : { forwarded: true };
}
