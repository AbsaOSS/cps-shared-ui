import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  Provider,
  provideAppInitializer
} from '@angular/core';
import { CpsTelemetryBroadcastHost } from '../../sinks/cps-broadcast/cps-broadcast-host.service';
import { CpsBroadcastTelemetrySink } from '../../sinks/cps-broadcast/cps-broadcast-telemetry.sink';
import { CPS_BROADCAST_CHANNEL } from '../../sinks/cps-broadcast/cps-broadcast.messages';
import { CpsRumTelemetrySink } from '../../sinks/cps-rum/cps-rum-telemetry.sink/cps-rum-telemetry.sink';
import { CpsNoopTelemetrySink } from '../../sinks/cps-telemetry/cps-noop-telemetry.sink/cps-noop-telemetry.sink';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { CpsRedactConfig } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import {
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY,
  CPS_DEFAULT_TELEMETRY_CONFIG,
  CpsTelemetryIdentity
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import {
  CPS_BI_CONFIG,
  CpsBiConfig
} from '../../config/cps-bi.config/cps-bi.config';
import {
  CPS_LOG_CONFIG,
  CpsLogConfig
} from '../../config/cps-log.config/cps-log.config';
import {
  CPS_SCENARIO_CONFIG,
  CpsScenarioConfig
} from '../../config/cps-scenario.config/cps-scenario.config';

/**
 * One optional concern's providers, composed onto {@link provideCpsTelemetry}.
 *
 * Applications never construct one directly — only through `withLogging`,
 * `withScenarios`, `withBiEvents` or `withRedaction`.
 *
 * @group Types
 */
export interface CpsTelemetryFeature {
  providers: Provider[];
}

/**
 * Configures logging. Omit to take the library defaults.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideCpsTelemetry}
 *
 * @group Utils
 */
export function withLogging(
  config: Partial<CpsLogConfig> = {}
): CpsTelemetryFeature {
  return {
    providers: [
      {
        provide: CPS_LOG_CONFIG,
        useValue: { ...CPS_DEFAULT_TELEMETRY_CONFIG.logs, ...config }
      }
    ]
  };
}

/**
 * Configures scenario telemetry. Omit to take the library defaults.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideCpsTelemetry}
 *
 * @group Utils
 */
export function withScenarios(
  config: Partial<CpsScenarioConfig> = {}
): CpsTelemetryFeature {
  return {
    providers: [
      {
        provide: CPS_SCENARIO_CONFIG,
        useValue: { ...CPS_DEFAULT_TELEMETRY_CONFIG.scenario, ...config }
      }
    ]
  };
}

/**
 * Configures BI event tracking. Omit to take the library defaults.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideCpsTelemetry}
 *
 * @group Utils
 */
export function withBiEvents(
  config: Partial<CpsBiConfig> = {}
): CpsTelemetryFeature {
  return {
    providers: [
      {
        provide: CPS_BI_CONFIG,
        useValue: { ...CPS_DEFAULT_TELEMETRY_CONFIG.bi, ...config }
      }
    ]
  };
}

/**
 * Configures PII redaction, shared by every concern. Omit to take the library
 * defaults.
 *
 * `extraKeyPatterns`/`extraValuePatterns` are copied into a fresh array, so
 * callers never share array identity with the defaults or each other.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideCpsTelemetry}
 *
 * @group Utils
 */
export function withRedaction(
  config: Partial<CpsRedactConfig> = {}
): CpsTelemetryFeature {
  const defaults = CPS_DEFAULT_TELEMETRY_CONFIG.redact;
  return {
    providers: [
      {
        provide: CPS_REDACT_CONFIG,
        useValue: {
          ...defaults,
          ...config,
          extraKeyPatterns: [
            ...(config.extraKeyPatterns ?? defaults.extraKeyPatterns)
          ],
          extraValuePatterns: [
            ...(config.extraValuePatterns ?? defaults.extraValuePatterns)
          ]
        }
      }
    ]
  };
}

/**
 * Registers the telemetry layer's configuration.
 *
 * Identity — `application`/`environment`/`version` — is mandatory and stated
 * once; every other concern is an optional, individually named feature
 * (`withLogging`, `withScenarios`, `withBiEvents`, `withRedaction`). Each
 * feature's token (e.g. {@link CPS_LOG_CONFIG}) can also be overridden
 * directly via plain DI substitution.
 *
 * Provides no destination. A sink and a log API provider must be bound
 * separately; injecting a telemetry service without them fails at bootstrap
 * with `NG0201`.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideCpsTelemetry(
 *     { application: 'composition', environment: 'prod', version: '22.0.0' },
 *     withLogging({ minLevel: 'warn' }),
 *     withScenarios({ maxSteps: 10 })
 *   ),
 *   provideCpsTelemetrySink('rum'),
 *   { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogApiProvider },
 *
 *   { provide: CPS_RUM_CREDENTIALS_PROVIDER, useExisting: AppRumCredentials }
 * ]
 * ```
 *
 * @param identity the application's identity, shared by every concern
 * @param features optional per-concern configuration; omitted ones take the
 *   library defaults
 * @returns providers for the telemetry configuration
 *
 * @group Utils
 */
export function provideCpsTelemetry(
  identity: CpsTelemetryIdentity,
  ...features: CpsTelemetryFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CPS_TELEMETRY_IDENTITY,
      useValue: {
        application: identity.application,
        environment: identity.environment,
        version: identity.version,
        eventNamespace:
          identity.eventNamespace || CPS_DEFAULT_TELEMETRY_CONFIG.eventNamespace
      }
    },
    ...withLogging().providers,
    ...withScenarios().providers,
    ...withBiEvents().providers,
    ...withRedaction().providers,
    ...features.flatMap((f) => f.providers)
  ]);
}

/**
 * Where a realm sends its telemetry.
 *
 * @group Types
 */
export type CpsTelemetrySinkMode =
  /** Straight to AWS CloudWatch RUM. Requires {@link CPS_RUM_CREDENTIALS_PROVIDER}. */
  | 'rum'
  /** To a shell realm running {@link provideCpsTelemetryBroadcastHost}. */
  | 'broadcast'
  /** Nowhere. Everything still runs; nothing is shipped. */
  | 'noop';

/**
 * Binds the telemetry destination. Every application needs exactly one call.
 *
 * - `'rum'` creates the AWS client and starts it during application
 *   initialization, fire-and-forget. Requires
 *   {@link CPS_RUM_CREDENTIALS_PROVIDER}.
 * - `'broadcast'` forwards to a shell realm running
 *   {@link provideCpsTelemetryBroadcastHost}, on a channel both sides name
 *   identically.
 * - `'noop'` discards everything.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideCpsTelemetry({ application: 'cart', environment, version }),
 *   provideCpsTelemetrySink(environment.embedded ? 'broadcast' : 'rum'),
 *   { provide: CPS_RUM_CREDENTIALS_PROVIDER, useExisting: CartRumCredentials }
 * ]
 * ```
 *
 * @param mode where this realm should send telemetry
 * @param options `channelName` for `broadcast` mode; must match the host's
 * @returns providers wiring the chosen sink
 *
 * @group Utils
 */
export function provideCpsTelemetrySink(
  mode: CpsTelemetrySinkMode,
  options?: { channelName?: string }
): EnvironmentProviders {
  switch (mode) {
    case 'rum':
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

    case 'broadcast':
      return makeEnvironmentProviders([
        CpsBroadcastTelemetrySink,
        { provide: CpsTelemetrySink, useExisting: CpsBroadcastTelemetrySink },
        ...(options?.channelName
          ? [{ provide: CPS_BROADCAST_CHANNEL, useValue: options.channelName }]
          : [])
      ]);

    case 'noop':
      return makeEnvironmentProviders([
        { provide: CpsTelemetrySink, useClass: CpsNoopTelemetrySink }
      ]);
  }
}

/**
 * Records telemetry forwarded by follower realms through this realm's sink.
 *
 * Provide it in the shell, alongside the real sink. Exactly one realm should.
 *
 * @param channelName the `BroadcastChannel` name; must match the followers'
 * @returns providers wiring the broadcast host
 *
 * @group Utils
 */
export function provideCpsTelemetryBroadcastHost(
  channelName?: string
): EnvironmentProviders {
  return makeEnvironmentProviders([
    CpsTelemetryBroadcastHost,
    ...(channelName
      ? [{ provide: CPS_BROADCAST_CHANNEL, useValue: channelName }]
      : []),
    // Constructed eagerly so it is listening before any fragment sends.
    provideAppInitializer(() => {
      inject(CpsTelemetryBroadcastHost);
    })
  ]);
}
