import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CPS_TELEMETRY_IDENTITY } from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { cpsSafeVoid } from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
import {
  CpsBroadcastConnection,
  cpsConnectBroadcastChannel,
  cpsIsBroadcastMessage
} from './cps-broadcast.messages';
import { CpsTelemetrySink } from '../cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

/**
 * Telemetry sink for a follower realm — a micro-frontend fragment, a webview
 * panel, any context with its own JavaScript realm but the same origin.
 *
 * Creates no AWS client of its own. Events are forwarded over a
 * `BroadcastChannel` to the realm running
 * {@link provideCpsTelemetryBroadcastHost}, which records them through the one
 * real sink. Application code sees no difference — it injects the same
 * services and calls the same methods.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideCpsTelemetry({ application: 'cart', environment: 'prod', version: '1.0.0' }),
 *   provideCpsTelemetrySink('broadcast')
 * ]
 * ```
 *
 * @group Services
 */
@Injectable()
export class CpsBroadcastTelemetrySink
  extends CpsTelemetrySink
  implements OnDestroy
{
  private readonly connection: CpsBroadcastConnection =
    cpsConnectBroadcastChannel('broadcastSink');

  /** The host's session id, once it has answered. */
  private sessionId?: string;
  private userId?: string;

  private readonly config = inject(CPS_TELEMETRY_IDENTITY);

  /**
   * This realm's own identity, stamped onto everything it forwards.
   *
   * The host records through its own RUM client, so without this, forwarded
   * events would all be labelled as the host's realm.
   */
  private readonly origin = {
    application: this.config.application,
    environment: this.config.environment,
    appVersion: this.config.version
  };

  constructor() {
    super();

    this.connection.onMessage((data) => this.onMessage(data));
    this.connection.post({ kind: 'identity-request' });
  }

  /** @inheritdoc */
  record(
    eventType: string,
    payload: object,
    metadata?: CpsTelemetryMetadata
  ): void {
    this.connection.post({
      kind: 'event',
      eventType,
      payload,
      metadata: { ...metadata, ...this.origin }
    });
  }

  /** @inheritdoc */
  recordError(error: CpsTelemetryError): void {
    this.connection.post({ kind: 'error', error });
  }

  /**
   * The host's session id.
   *
   * Returns `undefined` until the host answers. Log records written before
   * that carry no session id but are still correlated by `scenarioId`.
   *
   * @returns the shared session id, when known
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }

  /** @inheritdoc */
  setUserId(userId: string | undefined): void {
    this.userId = userId;
    this.connection.post({ kind: 'user', userId });
  }

  /** @inheritdoc */
  getUserId(): string | undefined {
    return this.userId;
  }

  /** @inheritdoc */
  flush(beacon = false): void {
    this.connection.post({ kind: 'flush', beacon });
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    this.connection.close();
  }

  private onMessage(data: unknown): void {
    cpsSafeVoid('broadcastSink.receive', () => {
      if (!cpsIsBroadcastMessage(data) || data.kind !== 'identity') {
        return;
      }
      this.sessionId = data.sessionId;
      this.userId = data.userId;
    });
  }
}
