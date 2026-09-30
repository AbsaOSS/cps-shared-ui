import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer
} from '@angular/core';
import {
  CPS_TELEMETRY_DIAGNOSTICS_CONFIG,
  CpsTelemetryDiagnosticsConfig
} from '../cps-diagnostics.models/cps-diagnostics.models';
import { CPS_DEFAULT_DIAGNOSTICS_CONFIG } from '../cps-diagnostics-store/cps-diagnostics-store';
import { CPS_DEFAULT_DIAGNOSTICS_SHORTCUTS } from '../cps-diagnostics-shortcut/cps-diagnostics-shortcut';
import { CpsTelemetryDiagnosticsService } from '../cps-telemetry-diagnostics.service/cps-telemetry-diagnostics.service';

/**
 * Adds the telemetry diagnostics popup: an in-app window showing, live,
 * every BI, scenario and log event this app hands to its destinations.
 *
 * Opens with ⇧⌥⌘8 (macOS) or Ctrl+Alt+Shift+8 (Windows, Linux) by
 * default, in every environment. Needs cps-ui-kit set up in the app, as
 * for any cps-ui-kit dialog.
 *
 * @example
 * ```typescript
 * import { provideCpsTelemetryDiagnostics } from 'cps-telemetry/diagnostics';
 *
 * providers: [
 *   provideCpsTelemetry({ application: 'my-app', environment, version }),
 *   provideCpsTelemetryDiagnostics()
 * ]
 *
 * // Or a different key, or access limited to some users:
 * provideCpsTelemetryDiagnostics({
 *   shortcuts: [{ code: 'KeyD', ctrl: true, alt: true, shift: true }],
 *   enabled: () => inject(AuthService).isSupportStaff()
 * })
 * ```
 *
 * @param config overrides merged over the defaults
 * @returns providers for the popup and its shortcut
 *
 * @group Utils
 */
export function provideCpsTelemetryDiagnostics(
  config: Partial<CpsTelemetryDiagnosticsConfig> = {}
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CPS_TELEMETRY_DIAGNOSTICS_CONFIG,
      useValue: {
        ...CPS_DEFAULT_DIAGNOSTICS_CONFIG,
        shortcuts: CPS_DEFAULT_DIAGNOSTICS_SHORTCUTS,
        ...config
      }
    },
    provideAppInitializer(() => {
      inject(CpsTelemetryDiagnosticsService).install();
    })
  ]);
}
