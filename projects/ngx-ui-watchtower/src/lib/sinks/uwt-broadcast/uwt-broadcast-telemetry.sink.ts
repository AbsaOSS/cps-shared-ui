import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { UWT_TELEMETRY_IDENTITY } from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { uwtSafeVoid } from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';
import {
  UwtBroadcastConnection,
  uwtConnectBroadcastChannel,
  uwtIsBroadcastMessage
} from './uwt-broadcast.messages';
import { UwtTelemetrySink } from '../uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';

/**
 * Telemetry sink for a follower realm — a micro-frontend fragment, a webview
 * panel, any context with its own JavaScript realm but the same origin.
 *
 * Creates no AWS client of its own. Events are forwarded over a
 * `BroadcastChannel` to the realm running
 * {@link provideUwtTelemetryBroadcastHost}, which records them through the one
 * real sink. Application code sees no difference — it injects the same
 * services and calls the same methods.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideUwtTelemetry({ application: 'cart', environment: 'prod', version: '1.0.0' }),
 *   provideUwtTelemetrySink('broadcast')
 * ]
 * ```
 *
 * @group Services
 */
@Injectable()
export class UwtBroadcastTelemetrySink
  extends UwtTelemetrySink
  implements OnDestroy
{
  private readonly connection: UwtBroadcastConnection =
    uwtConnectBroadcastChannel('broadcastSink');

  /** The host's session id, once it has answered. */
  private sessionId?: string;
  private userId?: string;

  private readonly config = inject(UWT_TELEMETRY_IDENTITY);

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
    metadata?: UwtTelemetryMetadata
  ): void {
    this.connection.post({
      kind: 'event',
      eventType,
      payload,
      metadata: { ...metadata, ...this.origin }
    });
  }

  /** @inheritdoc */
  recordError(error: UwtTelemetryError, metadata?: UwtTelemetryMetadata): void {
    this.connection.post({
      kind: 'error',
      error,
      metadata: { ...metadata, ...this.origin }
    });
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
    uwtSafeVoid('broadcastSink.receive', () => {
      if (!uwtIsBroadcastMessage(data) || data.kind !== 'identity') {
        return;
      }
      this.sessionId = data.sessionId;
      this.userId = data.userId;
    });
  }
}
