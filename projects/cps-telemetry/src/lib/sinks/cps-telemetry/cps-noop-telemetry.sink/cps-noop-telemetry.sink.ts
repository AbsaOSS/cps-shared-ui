import { Injectable } from '@angular/core';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CpsTelemetrySink } from '../cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

/**
 * Sink that discards everything.
 *
 * Selected with `provideCpsTelemetrySink('noop')` — never a default. Debug
 * flags, logging and scenario mechanics all still work, with no AWS account
 * or `aws-rum-web` dependency needed.
 *
 * @group Services
 */
@Injectable()
export class CpsNoopTelemetrySink extends CpsTelemetrySink {
  private userId?: string;

  /** @inheritdoc */
  record(
    _eventType: string,
    _payload: object,
    _metadata?: CpsTelemetryMetadata
  ): void {}

  /** @inheritdoc */
  recordError(
    _error: CpsTelemetryError,
    _metadata?: CpsTelemetryMetadata
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
