/*
 * Public API Surface of ngx-ui-watchtower
 *
 * Covers two audiences: an application using telemetry, and an author
 * writing a custom sink or log transport.
 */

// Configuration
export {
  UWT_DEFAULT_TELEMETRY_CONFIG,
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY
} from './lib/config/uwt-telemetry-common.config/uwt-telemetry-common.config';
export type { UwtTelemetryIdentity } from './lib/config/uwt-telemetry-common.config/uwt-telemetry-common.config';
export { UWT_BI_TELEMETRY_CONFIG } from './lib/config/uwt-bi-telemetry.config/uwt-bi-telemetry.config';
export type { UwtBITelemetryConfig } from './lib/config/uwt-bi-telemetry.config/uwt-bi-telemetry.config';
export { UWT_LOG_CONFIG } from './lib/config/uwt-log.config/uwt-log.config';
export type { UwtLogConfig } from './lib/config/uwt-log.config/uwt-log.config';
export { UWT_SCENARIO_TELEMETRY_CONFIG } from './lib/config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
export type { UwtScenarioTelemetryConfig } from './lib/config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';

// Providers
export {
  UwtTelemetryDestinationOptions,
  UwtTelemetryFeature,
  UwtTelemetryLocalSinkMode,
  provideUwtTelemetry,
  provideUwtTelemetryBroadcastHost,
  provideUwtTelemetryDestination,
  provideUwtTelemetrySink,
  withBIEvents,
  withLogging,
  withRedaction,
  withScenarios
} from './lib/providers/uwt-telemetry-common.providers/uwt-telemetry-common.providers';
export {
  UWT_LOG_API_PROVIDER,
  UwtLogApiProvider,
  UwtLogQuery
} from './lib/providers/uwt-log-api.provider/uwt-log-api.provider';
export { UwtNoopLogApiProvider } from './lib/providers/uwt-noop-log-api.provider/uwt-noop-log-api.provider';
export { UwtBroadcastLogApiProvider } from './lib/providers/uwt-broadcast-log-api.provider/uwt-broadcast-log-api.provider';

// Models
export type {
  UwtBIEvent,
  UwtBIEventDetail,
  UwtBIEventName,
  UwtBIEventNames
} from './lib/models/uwt-bi.models/uwt-bi.models';
export type {
  UwtLogger,
  UwtLoggerName,
  UwtLoggerNames,
  UwtLogDetail,
  UwtLogLevel,
  UwtLogRecord
} from './lib/models/uwt-log.models/uwt-log.models';
export { UWT_LOG_LEVEL_ORDER } from './lib/models/uwt-log.models/uwt-log.models';
export type {
  UwtScenarioAggregate,
  UwtScenarioName,
  UwtScenarioNames,
  UwtScenarioOptions,
  UwtScenarioOutcome,
  UwtScenarioRecord,
  UwtScenarioStatus,
  UwtScenarioStep,
  UwtScenarioStepDetail,
  UwtScenarioStepEvent,
  UwtScenarioStepStatus,
  UwtScenarioSteps,
  UwtStepName
} from './lib/models/uwt-scenario.models/uwt-scenario.models';
export {
  UWT_DEFAULT_EVENT_NAMESPACE,
  UWT_TELEMETRY_EVENT_TYPE,
  uwtEventTypes
} from './lib/models/uwt-telemetry-common.models/uwt-telemetry-common.models';
export type {
  UwtTelemetryAttribution,
  UwtTelemetryError,
  UwtTelemetryEventTypes,
  UwtTelemetryMetadata
} from './lib/models/uwt-telemetry-common.models/uwt-telemetry-common.models';
export {
  UwtJsonObject,
  UwtJsonValue,
  UwtTelemetryDestination,
  UwtTelemetryEventKind,
  UwtTelemetryEventOrigin,
  UwtTelemetryObservedEvent,
  UwtTelemetryPublishInput
} from './lib/models/uwt-telemetry-monitor.models/uwt-telemetry-monitor.models';

// Services
export { UwtBITelemetryService } from './lib/services/uwt-bi-telemetry.service/uwt-bi-telemetry.service';
export { UwtLoggerService } from './lib/services/uwt-logger.service/uwt-logger.service';
export { UwtScenario } from './lib/scenario/uwt-scenario/uwt-scenario';
export { UwtTelemetryMonitor } from './lib/services/uwt-telemetry-monitor.service/uwt-telemetry-monitor.service';
export { UwtScenarioTelemetryService } from './lib/services/uwt-scenario-telemetry.service/uwt-scenario-telemetry.service';

// Sinks
export { UwtTelemetryBroadcastHost } from './lib/sinks/uwt-broadcast/uwt-broadcast-host.service';
export { UwtBroadcastTelemetrySink } from './lib/sinks/uwt-broadcast/uwt-broadcast-telemetry.sink';
export {
  UWT_BROADCAST_CHANNEL,
  UWT_DEFAULT_BROADCAST_CHANNEL
} from './lib/sinks/uwt-broadcast/uwt-broadcast.messages';
export { UwtTelemetrySink } from './lib/sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
export { UwtNoopTelemetrySink } from './lib/sinks/uwt-telemetry/uwt-noop-telemetry.sink/uwt-noop-telemetry.sink';

// Utilities an application or a custom sink needs
export { traceScenario } from './lib/scenario/uwt-scenario-operators/uwt-scenario-operators';
export { uwtClassifyTelemetryEvent } from './lib/utils/uwt-telemetry-event.util/uwt-telemetry-event.util';
export type { UwtTelemetrySinkEvent } from './lib/utils/uwt-telemetry-event.util/uwt-telemetry-event.util';
export type { UwtTraceScenarioOptions } from './lib/scenario/uwt-scenario-operators/uwt-scenario-operators';
export { uwtIsDebugEnabled } from './lib/utils/uwt-debug-flag.util/uwt-debug-flag.util';
export type { UwtDebugFlag } from './lib/utils/uwt-debug-flag.util/uwt-debug-flag.util';
export { uwtUuid } from './lib/utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';
export {
  UWT_DEFAULT_REDACT_CONFIG,
  UWT_REDACTED,
  UwtPiiValuePattern,
  UwtRedactConfig,
  uwtNormalizeError,
  uwtRedactConfigFor,
  uwtRedactMetadata,
  uwtScrubString
} from './lib/utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';
