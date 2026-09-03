import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer
} from '@angular/core';
import { CpsTelemetrySink } from 'cps-telemetry';
import { CpsRumTelemetrySink } from '../cps-rum-telemetry.sink/cps-rum-telemetry.sink';

/**
 * Sends telemetry straight to AWS CloudWatch RUM. Requires
 * {@link CPS_RUM_CREDENTIALS_PROVIDER}.
 *
 * Exported from a separate entry point (`cps-telemetry/rum`), not the main
 * one, on purpose: `aws-rum-web` is an optional peer dependency, and an
 * application that only ever calls `provideCpsTelemetrySink('broadcast' |
 * 'noop')` must never be required to install it. Keeping `CpsRumTelemetrySink`
 * (and this function) out of the main entry point's module graph is what
 * makes that true — a bundler resolves a dynamic `import()`'s specifier at
 * build time regardless of whether that branch ever runs, so a static
 * import of the RUM sink anywhere in the common providers module would
 * force every consumer to have `aws-rum-web` resolvable, not just the ones
 * that select `'rum'`. See DESIGN.md §3, "Entry points".
 *
 * @example
 * ```typescript
 * import { provideCpsTelemetryRumSink } from 'cps-telemetry/rum';
 *
 * providers: [
 *   provideCpsTelemetry({ application: 'cart', environment, version }),
 *   provideCpsTelemetryRumSink(),
 *   { provide: CPS_RUM_CREDENTIALS_PROVIDER, useExisting: CartRumCredentials }
 * ]
 * ```
 *
 * @returns providers wiring the RUM sink
 *
 * @group Utils
 */
export function provideCpsTelemetryRumSink(): EnvironmentProviders {
  return makeEnvironmentProviders([
    CpsRumTelemetrySink,
    { provide: CpsTelemetrySink, useExisting: CpsRumTelemetrySink },
    provideAppInitializer(() => {
      // Not returned, so a slow or hung credential broker doesn't delay
      // first paint.
      inject(CpsRumTelemetrySink)
        .init()
        .catch(() => undefined);
    })
  ]);
}
