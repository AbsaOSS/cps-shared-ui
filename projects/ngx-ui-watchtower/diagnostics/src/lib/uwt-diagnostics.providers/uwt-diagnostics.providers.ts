import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer
} from '@angular/core';
import {
  UWT_TELEMETRY_DIAGNOSTICS_CONFIG,
  UwtTelemetryDiagnosticsConfig
} from '../uwt-diagnostics.models/uwt-diagnostics.models';
import { UWT_DEFAULT_DIAGNOSTICS_CONFIG } from '../uwt-diagnostics-store/uwt-diagnostics-store';
import { UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS } from '../uwt-diagnostics-shortcut/uwt-diagnostics-shortcut';
import { UwtTelemetryDiagnosticsService } from '../uwt-telemetry-diagnostics.service/uwt-telemetry-diagnostics.service';

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
 * import { provideUwtTelemetryDiagnostics } from '@absaoss-cps/ngx-ui-watchtower/diagnostics';
 *
 * providers: [
 *   provideUwtTelemetry({ application: 'my-app', environment, version }),
 *   provideUwtTelemetryDiagnostics()
 * ]
 *
 * // Or a different key, or access limited to some users:
 * provideUwtTelemetryDiagnostics({
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
export function provideUwtTelemetryDiagnostics(
  config: Partial<UwtTelemetryDiagnosticsConfig> = {}
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: UWT_TELEMETRY_DIAGNOSTICS_CONFIG,
      useValue: {
        ...UWT_DEFAULT_DIAGNOSTICS_CONFIG,
        shortcuts: UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS,
        ...config
      }
    },
    provideAppInitializer(() => {
      inject(UwtTelemetryDiagnosticsService).install();
    })
  ]);
}
