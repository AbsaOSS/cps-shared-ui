/*
 * Public API Surface of ngx-ui-watchtower/rum
 *
 * A separate entry point from `@absaoss-cps/ngx-ui-watchtower` itself, so that an
 * application using only `provideUwtTelemetrySink('broadcast' | 'noop')`
 * never needs `aws-rum-web` (an optional peer dependency) resolvable at
 * build time — see `provideUwtTelemetryRumSink`'s own doc comment.
 */

export { provideUwtTelemetryRumSink } from './lib/uwt-rum.providers/uwt-rum.providers';
export { UWT_RUM_CREDENTIALS_PROVIDER } from './lib/uwt-rum-credentials/uwt-rum-credentials';
export type {
  UwtRumAppMonitorConfig,
  UwtRumBootstrap,
  UwtRumCredentials,
  UwtRumCredentialsProvider
} from './lib/uwt-rum-credentials/uwt-rum-credentials';
export { UwtRumTelemetrySink } from './lib/uwt-rum-telemetry.sink/uwt-rum-telemetry.sink';
