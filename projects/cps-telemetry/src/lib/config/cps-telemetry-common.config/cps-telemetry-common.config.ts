import { InjectionToken } from '@angular/core';
import {
  CpsBiConfig,
  CPS_DEFAULT_BI_CONFIG
} from '../cps-bi.config/cps-bi.config';
import {
  CpsLogConfig,
  CPS_DEFAULT_LOG_CONFIG
} from '../cps-log.config/cps-log.config';
import {
  CpsScenarioConfig,
  CPS_DEFAULT_SCENARIO_CONFIG
} from '../cps-scenario.config/cps-scenario.config';
import { CPS_DEFAULT_EVENT_NAMESPACE } from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import {
  CPS_DEFAULT_REDACT_CONFIG,
  CpsRedactConfig
} from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';

/**
 * The identity every telemetry record and event carries — application name,
 * deployment environment and version, plus the event-type namespace.
 *
 * @group Interfaces
 */
export interface CpsTelemetryIdentity {
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
   * Defaults to `com.cps`.
   */
  eventNamespace?: string;
}

/**
 * Library defaults for every concern not carried by {@link CpsTelemetryIdentity}
 * — applied by {@link provideCpsTelemetry} to anything not overridden through a
 * `with*()` feature.
 *
 * @group Utils
 */
export const CPS_DEFAULT_TELEMETRY_CONFIG: {
  eventNamespace: string;
  scenario: CpsScenarioConfig;
  logs: CpsLogConfig;
  bi: CpsBiConfig;
  redact: CpsRedactConfig;
} = {
  eventNamespace: CPS_DEFAULT_EVENT_NAMESPACE,
  scenario: CPS_DEFAULT_SCENARIO_CONFIG,
  logs: CPS_DEFAULT_LOG_CONFIG,
  bi: CPS_DEFAULT_BI_CONFIG,
  redact: CPS_DEFAULT_REDACT_CONFIG
};

/**
 * The application's identity — shared by every concern; see
 * {@link CpsTelemetryIdentity}.
 *
 * @group Tokens
 */
export const CPS_TELEMETRY_IDENTITY = new InjectionToken<CpsTelemetryIdentity>(
  'CPS_TELEMETRY_IDENTITY'
);

/**
 * Resolved redaction configuration, shared by every concern. Provided by
 * {@link provideCpsTelemetry}, overridden with `withRedaction(...)`.
 *
 * @group Tokens
 */
export const CPS_REDACT_CONFIG = new InjectionToken<CpsRedactConfig>(
  'CPS_REDACT_CONFIG'
);
