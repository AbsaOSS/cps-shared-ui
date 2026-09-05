import { Injectable } from '@angular/core';
import {
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../../models/cps-telemetry-common.models/cps-telemetry-common.models';

/**
 * Destination for scenario and BI telemetry.
 *
 * Application code never touches this directly — it lets the AWS RUM
 * integration be replaced or stubbed with no change to the telemetry
 * services or the applications that use them.
 *
 * @group Services
 */
@Injectable()
export abstract class CpsTelemetrySink {
  /**
   * Records one custom event. Must be non-throwing and non-blocking.
   *
   * @param eventType one of {@link CPS_TELEMETRY_EVENT_TYPE}
   * @param payload the event body
   * @param metadata optional flat attributes attached to the event envelope
   */
  abstract record(
    eventType: string,
    payload: object,
    metadata?: CpsTelemetryMetadata
  ): void;

  /**
   * Records a handled error as a first-class error signal, alongside errors
   * the RUM client captures itself. Only reached when
   * {@link CpsLogConfig.mirrorErrorsToRum} is enabled.
   *
   * @param error the normalized error
   * @param metadata optional flat attributes attached to the error envelope
   *   (e.g. a forwarding sink's own origin identity)
   */
  abstract recordError(
    error: CpsTelemetryError,
    metadata?: CpsTelemetryMetadata
  ): void;

  /** Returns the current session identifier, when the implementation has one. */
  abstract getSessionId(): string | undefined;

  /**
   * Associates subsequent telemetry with an application user identifier, or
   * with nobody. `undefined` means signed out.
   *
   * @param userId the application's own user identifier, or `undefined` to
   *   stop attributing telemetry to the previous one
   */
  abstract setUserId(userId: string | undefined): void;

  /** Returns the user identifier last given to {@link setUserId}, if any. */
  abstract getUserId(): string | undefined;

  /**
   * Requests that buffered telemetry be sent immediately.
   *
   * @param beacon use a transport that survives page unload
   */
  abstract flush(beacon?: boolean): void;
}
