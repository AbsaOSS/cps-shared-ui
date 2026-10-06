import { EnvironmentProviders } from '@angular/core';
import { provideUwtTelemetryDestination } from '@absaoss-cps/ngx-ui-watchtower';
import { UwtRumTelemetrySink } from '../uwt-rum-telemetry.sink/uwt-rum-telemetry.sink';

/**
 * Sends telemetry straight to AWS CloudWatch RUM. Requires
 * {@link UWT_RUM_CREDENTIALS_PROVIDER}.
 *
 * Exported from a separate entry point (`@absaoss-cps/ngx-ui-watchtower/rum`), not the main
 * one, on purpose: `aws-rum-web` is an optional peer dependency, and an
 * application that only ever calls `provideUwtTelemetrySink('broadcast' |
 * 'noop')` must never be required to install it. Keeping `UwtRumTelemetrySink`
 * (and this function) out of the main entry point's module graph is what
 * makes that true — a bundler resolves a dynamic `import()`'s specifier at
 * build time regardless of whether that branch ever runs, so a static
 * import of the RUM sink anywhere in the common providers module would
 * force every consumer to have `aws-rum-web` resolvable, not just the ones
 * that import this entry point.
 *
 * @example
 * ```typescript
 * import { provideUwtTelemetryRumSink } from '@absaoss-cps/ngx-ui-watchtower/rum';
 *
 * providers: [
 *   provideUwtTelemetry({ application: 'cart', environment, version }),
 *   provideUwtTelemetryRumSink(),
 *   { provide: UWT_RUM_CREDENTIALS_PROVIDER, useExisting: CartRumCredentials }
 * ]
 * ```
 *
 * @returns providers wiring the RUM sink
 *
 * @group Utils
 */
export function provideUwtTelemetryRumSink(): EnvironmentProviders {
  return provideUwtTelemetryDestination(UwtRumTelemetrySink, {
    // Not awaited, so a slow or hung credential broker doesn't delay first
    // paint.
    init: (sink) => {
      sink.init().catch(() => undefined);
    }
  });
}
