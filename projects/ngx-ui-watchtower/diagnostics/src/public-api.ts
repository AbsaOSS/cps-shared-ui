/*
 * Public API Surface of ngx-ui-watchtower/diagnostics
 *
 * An in-app popup showing, live, every event this app hands to its
 * telemetry destinations. Needs cps-ui-kit.
 */

export {
  UWT_TELEMETRY_DIAGNOSTICS_CONFIG,
  UwtDiagnosticsExport,
  UwtDiagnosticsFieldFilter,
  UwtDiagnosticsFilterOperator,
  UwtDiagnosticsFilterState,
  UwtDiagnosticsSectionId,
  UwtDiagnosticsShortcut,
  UwtTelemetryDiagnosticsConfig
} from './lib/uwt-diagnostics.models/uwt-diagnostics.models';
export { UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS } from './lib/uwt-diagnostics-shortcut/uwt-diagnostics-shortcut';
export { UWT_DEFAULT_DIAGNOSTICS_CONFIG } from './lib/uwt-diagnostics-store/uwt-diagnostics-store';
export { provideUwtTelemetryDiagnostics } from './lib/uwt-diagnostics.providers/uwt-diagnostics.providers';
export { UwtTelemetryDiagnosticsService } from './lib/uwt-telemetry-diagnostics.service/uwt-telemetry-diagnostics.service';
