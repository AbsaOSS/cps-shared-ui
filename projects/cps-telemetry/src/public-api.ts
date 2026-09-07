/*
 * Public API Surface of cps-telemetry
 *
 * Covers two audiences: an application using telemetry, and an author
 * writing a custom sink or log transport.
 */

// Configuration
export {
  CPS_DEFAULT_TELEMETRY_CONFIG,
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY,
  CpsTelemetryIdentity
} from './lib/config/cps-telemetry-common.config/cps-telemetry-common.config';
export {
  CPS_BI_TELEMETRY_CONFIG,
  CpsBiTelemetryConfig
} from './lib/config/cps-bi-telemetry.config/cps-bi-telemetry.config';
export {
  CPS_LOG_CONFIG,
  CpsLogConfig
} from './lib/config/cps-log.config/cps-log.config';
export {
  CPS_SCENARIO_TELEMETRY_CONFIG,
  CpsScenarioTelemetryConfig
} from './lib/config/cps-scenario-telemetry.config/cps-scenario-telemetry.config';

// Providers
export {
  CpsTelemetryFeature,
  CpsTelemetryLocalSinkMode,
  provideCpsTelemetry,
  provideCpsTelemetryBroadcastHost,
  provideCpsTelemetrySink,
  withBiEvents,
  withLogging,
  withRedaction,
  withScenarios
} from './lib/providers/cps-telemetry-common.providers/cps-telemetry-common.providers';
export {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider,
  CpsLogQuery
} from './lib/providers/cps-log-api.provider/cps-log-api.provider';

// Models
export {
  CpsBiEvent,
  CpsBiEventDetail,
  CpsBiEventName,
  CpsBiEventNames
} from './lib/models/cps-bi.models/cps-bi.models';
export {
  CPS_LOG_LEVEL_ORDER,
  CpsLoggerName,
  CpsLoggerNames,
  CpsLogDetail,
  CpsLogLevel,
  CpsLogRecord
} from './lib/models/cps-log.models/cps-log.models';
export {
  CpsScenarioAggregate,
  CpsScenarioName,
  CpsScenarioNames,
  CpsScenarioOptions,
  CpsScenarioOutcome,
  CpsScenarioRecord,
  CpsScenarioStatus,
  CpsScenarioStep,
  CpsScenarioStepDetail,
  CpsScenarioStepStatus,
  CpsScenarioSteps,
  CpsStepName
} from './lib/models/cps-scenario.models/cps-scenario.models';
export {
  CPS_DEFAULT_EVENT_NAMESPACE,
  CPS_TELEMETRY_EVENT_TYPE,
  cpsEventTypes,
  CpsTelemetryError,
  CpsTelemetryEventTypes,
  CpsTelemetryMetadata
} from './lib/models/cps-telemetry-common.models/cps-telemetry-common.models';

// Services
export { CpsBiTelemetryService } from './lib/services/cps-bi-telemetry.service/cps-bi-telemetry.service';
export {
  CpsLogBindings,
  CpsLogger,
  CpsLoggerService
} from './lib/services/cps-logger.service/cps-logger.service';
export { CpsScenario } from './lib/scenario/cps-scenario/cps-scenario';
export { CpsScenarioTelemetryService } from './lib/services/cps-scenario-telemetry.service/cps-scenario-telemetry.service';

// Sinks
export { CpsTelemetryBroadcastHost } from './lib/sinks/cps-broadcast/cps-broadcast-host.service';
export { CpsBroadcastTelemetrySink } from './lib/sinks/cps-broadcast/cps-broadcast-telemetry.sink';
export {
  CPS_BROADCAST_CHANNEL,
  CPS_DEFAULT_BROADCAST_CHANNEL
} from './lib/sinks/cps-broadcast/cps-broadcast.messages';
export { CpsTelemetrySink } from './lib/sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
export { CpsNoopTelemetrySink } from './lib/sinks/cps-telemetry/cps-noop-telemetry.sink/cps-noop-telemetry.sink';

// Utilities an application or a custom sink needs
export {
  CpsTraceScenarioOptions,
  traceScenario
} from './lib/scenario/cps-scenario-operators/cps-scenario-operators';
export {
  CpsDebugFlag,
  cpsIsDebugEnabled
} from './lib/utils/cps-debug-flag.util/cps-debug-flag.util';
export { cpsUuid } from './lib/utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
export {
  CPS_DEFAULT_REDACT_CONFIG,
  CPS_REDACTED,
  CpsPiiValuePattern,
  CpsRedactConfig,
  cpsNormalizeError,
  cpsRedactConfigFor,
  cpsRedactMetadata,
  cpsScrubString
} from './lib/utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
