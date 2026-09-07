/*
 * Public API Surface of cps-telemetry/rum
 *
 * A separate entry point from `cps-telemetry` itself, so that an
 * application using only `provideCpsTelemetrySink('broadcast' | 'noop')`
 * never needs `aws-rum-web` (an optional peer dependency) resolvable at
 * build time — see `provideCpsTelemetryRumSink`'s own doc comment, and
 * DESIGN.md §3, "Entry points".
 */

export { provideCpsTelemetryRumSink } from './lib/cps-rum.providers/cps-rum.providers';
export {
  CPS_RUM_CREDENTIALS_PROVIDER,
  CpsRumAppMonitorConfig,
  CpsRumBootstrap,
  CpsRumCredentials,
  CpsRumCredentialsProvider
} from './lib/cps-rum-credentials/cps-rum-credentials';
export { CpsRumTelemetrySink } from './lib/cps-rum-telemetry.sink/cps-rum-telemetry.sink';
