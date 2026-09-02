import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  cpsSafe,
  cpsSafeVoid
} from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
import {
  CpsBroadcastConnection,
  cpsConnectBroadcastChannel,
  cpsIsBroadcastMessage
} from './cps-broadcast.messages';
import { CpsTelemetrySink } from '../cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

/**
 * Receives telemetry forwarded by follower realms and records it through this
 * realm's sink.
 *
 * Runs in the shell, the realm with the real sink. Fragments using
 * {@link CpsBroadcastTelemetrySink} post their events here, so one AWS client,
 * one session and one event budget serve the whole composed page.
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

  constructor() {
    this.connection.onMessage((data) => this.onMessage(data));
    this.announceIdentity();
  }

  /** How many follower messages have been accepted. */
  get received(): number {
    return this._received;
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    this.connection.close();
  }

  private onMessage(data: unknown): void {
    cpsSafeVoid('broadcastHost.receive', () => {
      if (!cpsIsBroadcastMessage(data)) {
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
          this.sink.recordError(data.error);
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
          // eslint-disable-next-line no-console
          console.warn(
            `[cps-telemetry] a second telemetry host is active on channel "${this.connection.channelName}"; only one realm should provide it`
          );
          break;
      }
    });
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
