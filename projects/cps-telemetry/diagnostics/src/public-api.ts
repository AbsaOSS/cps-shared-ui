/*
 * Public API Surface of cps-telemetry/diagnostics
 *
 * An in-app popup showing, live, every event this app hands to its
 * telemetry destinations. Needs cps-ui-kit.
 */

export {
  CPS_TELEMETRY_DIAGNOSTICS_CONFIG,
  CpsDiagnosticsExport,
  CpsDiagnosticsFieldFilter,
  CpsDiagnosticsFilterOperator,
  CpsDiagnosticsFilterState,
  CpsDiagnosticsSectionId,
  CpsDiagnosticsShortcut,
  CpsTelemetryDiagnosticsConfig
} from './lib/cps-diagnostics.models/cps-diagnostics.models';
export { CPS_DEFAULT_DIAGNOSTICS_SHORTCUTS } from './lib/cps-diagnostics-shortcut/cps-diagnostics-shortcut';
export { CPS_DEFAULT_DIAGNOSTICS_CONFIG } from './lib/cps-diagnostics-store/cps-diagnostics-store';
export { provideCpsTelemetryDiagnostics } from './lib/cps-diagnostics.providers/cps-diagnostics.providers';
export { CpsTelemetryDiagnosticsService } from './lib/cps-telemetry-diagnostics.service/cps-telemetry-diagnostics.service';
