import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  cpsSafe,
  cpsSafeVoid
} from '../../utils/cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';
import {
  CpsBroadcastConnection,
  cpsConnectBroadcastChannel,
  cpsElectBroadcastHostLeader,
  cpsIsBroadcastMessage
} from './cps-broadcast.messages';
import { CpsTelemetrySink } from '../cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

/**
 * Active host count per channel, scoped to this JS realm — distinguishes a
 * true duplicate provider from another tab sharing the same channel.
 */
const hostsInThisRealm = new Map<string, number>();

/**
 * Receives telemetry forwarded by follower realms and records it through this
 * realm's sink.
 *
 * Runs in the shell, the realm with the real sink. Fragments using
 * {@link CpsBroadcastTelemetrySink} post their events here, so one AWS client,
 * one session and one event budget serve the whole composed page.
 *
 * A Web Locks-based election ({@link cpsElectBroadcastHostLeader}) keeps
 * exactly one host active per channel; others stay passive.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideCpsTelemetry({ application: 'shell', environment: 'prod', version: '1.0.0' }),
 *   provideCpsTelemetrySink('rum'),
 *   provideCpsTelemetryBroadcastHost()
 * ]
 * ```
 *
 * @group Services
 */
@Injectable()
export class CpsTelemetryBroadcastHost implements OnDestroy {
  private readonly sink = inject(CpsTelemetrySink);
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

  constructor() {
    this.connection.onMessage((data) => this.onMessage(data));
    this.releaseLeadership = cpsElectBroadcastHostLeader(
      this.connection.channelName,
      () => {
        this.isLeader = true;
        this.announceIdentity();
      }
    );
    this.warnIfDuplicateInThisRealm();
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

      if (data.kind !== 'identity' && data.kind !== 'identity-request') {
        this._received++;
      }

      switch (data.kind) {
        case 'event':
          this.sink.record(data.eventType, data.payload, data.metadata);
          this.reannounceIfIdentityChanged();
          break;
        case 'error':
          this.sink.recordError(data.error, data.metadata);
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
      }
    });
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
        // eslint-disable-next-line no-console
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
