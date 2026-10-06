import { InjectionToken } from '@angular/core';
import {
  UwtBITelemetryConfig,
  UWT_DEFAULT_BI_TELEMETRY_CONFIG
} from '../uwt-bi-telemetry.config/uwt-bi-telemetry.config';
import {
  UwtLogConfig,
  UWT_DEFAULT_LOG_CONFIG
} from '../uwt-log.config/uwt-log.config';
import {
  UwtScenarioTelemetryConfig,
  UWT_DEFAULT_SCENARIO_TELEMETRY_CONFIG
} from '../uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
import { UWT_DEFAULT_EVENT_NAMESPACE } from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import {
  UWT_DEFAULT_REDACT_CONFIG,
  UwtRedactConfig
} from '../../utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';

/**
 * The identity every telemetry record and event carries — application name,
 * deployment environment and version, plus the event-type namespace.
 *
 * @group Interfaces
 */
export interface UwtTelemetryIdentity {
  /** Application name, e.g. `composition`. Becomes a session attribute. */
  application: string;

  /** Deployment environment, e.g. `dev`, `qa`, `prod`. */
  environment: string;

  /** Application version, e.g. `22.0.0`. */
  version: string;

  /**
   * Prefix for the custom event types this library emits — `{namespace}.scenario`,
   * `{namespace}.scenario.step` and `{namespace}.bi`.
   *
   * Defaults to `com.uwt`.
   */
  eventNamespace?: string;
}

/**
 * Library defaults for every concern not carried by {@link UwtTelemetryIdentity}
 * — applied by {@link provideUwtTelemetry} to anything not overridden through a
 * `with*()` feature.
 *
 * @group Utils
 */
export const UWT_DEFAULT_TELEMETRY_CONFIG: {
  eventNamespace: string;
  scenario: UwtScenarioTelemetryConfig;
  logs: UwtLogConfig;
  bi: UwtBITelemetryConfig;
  redact: UwtRedactConfig;
} = {
  eventNamespace: UWT_DEFAULT_EVENT_NAMESPACE,
  scenario: UWT_DEFAULT_SCENARIO_TELEMETRY_CONFIG,
  logs: UWT_DEFAULT_LOG_CONFIG,
  bi: UWT_DEFAULT_BI_TELEMETRY_CONFIG,
  redact: UWT_DEFAULT_REDACT_CONFIG
};

/**
 * The application's identity — shared by every concern; see
 * {@link UwtTelemetryIdentity}.
 *
 * @group Tokens
 */
export const UWT_TELEMETRY_IDENTITY = new InjectionToken<UwtTelemetryIdentity>(
  'UWT_TELEMETRY_IDENTITY'
);

/**
 * Resolved redaction configuration, shared by every concern. Provided by
 * {@link provideUwtTelemetry}, overridden with `withRedaction(...)`.
 *
 * @group Tokens
 */
export const UWT_REDACT_CONFIG = new InjectionToken<UwtRedactConfig>(
  'UWT_REDACT_CONFIG'
);
