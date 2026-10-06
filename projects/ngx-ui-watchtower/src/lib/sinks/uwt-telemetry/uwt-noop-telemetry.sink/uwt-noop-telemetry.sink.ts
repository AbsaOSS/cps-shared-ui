import { Injectable } from '@angular/core';
import {
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { UwtTelemetrySink } from '../uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';

/**
 * Sink that discards everything.
 *
 * Selected with `provideUwtTelemetrySink('noop')` — never a default. Debug
 * flags, logging and scenario mechanics all still work, with no AWS account
 * or `aws-rum-web` dependency needed.
 *
 * @group Services
 */
@Injectable()
export class UwtNoopTelemetrySink extends UwtTelemetrySink {
  private userId?: string;

  /** @inheritdoc */
  record(
    _eventType: string,
    _payload: object,
    _metadata?: UwtTelemetryMetadata
  ): void {}

  /** @inheritdoc */
  recordError(
    _error: UwtTelemetryError,
    _metadata?: UwtTelemetryMetadata
  ): void {}

  /** @inheritdoc */
  getSessionId(): string | undefined {
    return undefined;
  }

  /** @inheritdoc */
  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  /** @inheritdoc */
  getUserId(): string | undefined {
    return this.userId;
  }

  /** @inheritdoc */
  flush(_beacon?: boolean): void {}
}
