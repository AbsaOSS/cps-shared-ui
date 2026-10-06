import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Provider,
  provideAppInitializer,
  Type
} from '@angular/core';
import { CpsTelemetryBroadcastHost } from '../../sinks/cps-broadcast/cps-broadcast-host.service';
import { CpsBroadcastTelemetrySink } from '../../sinks/cps-broadcast/cps-broadcast-telemetry.sink';
import { CPS_BROADCAST_CHANNEL } from '../../sinks/cps-broadcast/cps-broadcast.messages';
import { CpsNoopTelemetrySink } from '../../sinks/cps-telemetry/cps-noop-telemetry.sink/cps-noop-telemetry.sink';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { CpsRedactConfig } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import { CpsBroadcastLogApiProvider } from '../cps-broadcast-log-api.provider/cps-broadcast-log-api.provider';
import { CPS_LOG_API_PROVIDER } from '../cps-log-api.provider/cps-log-api.provider';
import { cpsSafeVoid } from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
import {
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY,
  CPS_DEFAULT_TELEMETRY_CONFIG,
  CpsTelemetryIdentity
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import {
  CPS_BI_TELEMETRY_CONFIG,
  CpsBITelemetryConfig
} from '../../config/cps-bi-telemetry.config/cps-bi-telemetry.config';
import {
  CPS_LOG_CONFIG,
  CpsLogConfig
} from '../../config/cps-log.config/cps-log.config';
import {
  CPS_SCENARIO_TELEMETRY_CONFIG,
  CpsScenarioTelemetryConfig
} from '../../config/cps-scenario-telemetry.config/cps-scenario-telemetry.config';

/**
 * One optional concern's providers, composed onto {@link provideCpsTelemetry}.
 *
 * Applications never construct one directly — only through `withLogging`,
 * `withScenarios`, `withBIEvents` or `withRedaction`.
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
  config: Partial<CpsScenarioTelemetryConfig> = {}
): CpsTelemetryFeature {
  return {
    providers: [
      {
        provide: CPS_SCENARIO_TELEMETRY_CONFIG,
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
export function withBIEvents(
  config: Partial<CpsBITelemetryConfig> = {}
): CpsTelemetryFeature {
  return {
    providers: [
      {
        provide: CPS_BI_TELEMETRY_CONFIG,
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
          ],
          extraValueTransforms: [
            ...(config.extraValueTransforms ?? defaults.extraValueTransforms)
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
 * (`withLogging`, `withScenarios`, `withBIEvents`, `withRedaction`). Each
 * feature's token (e.g. {@link CPS_LOG_CONFIG}) can also be overridden
 * directly via plain DI substitution.
 *
 * Provides no destination. A sink and a log API provider must be bound
 * separately; injecting a telemetry service without them fails at bootstrap
 * with `NG0201`.
 *
 * @example
 * ```typescript
 * import { provideCpsTelemetryRumSink, CPS_RUM_CREDENTIALS_PROVIDER } from 'cps-telemetry/rum';
 *
 * providers: [
 *   provideCpsTelemetry(
 *     { application: 'composition', environment: 'prod', version: '22.0.0' },
 *     withLogging({ minLevel: 'warn' }),
 *     withScenarios({ maxSteps: 10 })
 *   ),
 *   provideCpsTelemetryRumSink(),
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
    ...withBIEvents().providers,
    ...withRedaction().providers,
    ...features.flatMap((f) => f.providers)
  ]);
}

/**
 * Every destination registered through {@link provideCpsTelemetryDestination},
 * so bootstrap can insist on exactly one. Internal.
 */
const CPS_TELEMETRY_DESTINATIONS = new InjectionToken<Type<CpsTelemetrySink>[]>(
  'CPS_TELEMETRY_DESTINATIONS'
);

/** Sinks whose `init` already ran — the same destination may be listed twice. */
const initializedSinks = new WeakSet<CpsTelemetrySink>();

/**
 * Options for {@link provideCpsTelemetryDestination}.
 *
 * @group Interfaces
 */
export interface CpsTelemetryDestinationOptions<T extends CpsTelemetrySink> {
  /**
   * Runs once at startup, from an app initializer — for example to load
   * credentials or start a client. Not awaited, so a slow destination never
   * delays first paint. Fail-open, like every other call into a
   * destination: a throw is reported in dev mode and never breaks bootstrap.
   */
  init?: (sink: T) => void;
}

/**
 * Registers the realm's telemetry destination: the one sink every scenario,
 * BI event and mirrored error is handed to.
 *
 * Every destination is registered this way — the RUM sink
 * ({@link provideCpsTelemetryRumSink}), `'broadcast'` and `'noop'`
 * ({@link provideCpsTelemetrySink}), and any sink an application or another
 * package writes. Swapping destinations is swapping this one call;
 * application code doesn't change.
 *
 * Exactly one destination is allowed. Registering two different ones fails
 * at bootstrap, rather than silently keeping whichever came last.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideCpsTelemetry({ application: 'my-app', environment, version }),
 *   provideCpsTelemetryDestination(MyBackendSink, { init: (sink) => sink.start() }),
 *   { provide: CPS_LOG_API_PROVIDER, useExisting: MyLogBackend }
 * ]
 * ```
 *
 * @param sink the destination's class; it is provided here too
 * @param options optional startup hook
 * @returns providers binding {@link CpsTelemetrySink} to `sink`
 *
 * @group Utils
 */
export function provideCpsTelemetryDestination<T extends CpsTelemetrySink>(
  sink: Type<T>,
  options?: CpsTelemetryDestinationOptions<T>
): EnvironmentProviders {
  return makeEnvironmentProviders([
    sink,
    { provide: CpsTelemetrySink, useExisting: sink },
    { provide: CPS_TELEMETRY_DESTINATIONS, useValue: sink, multi: true },
    provideAppInitializer(() => {
      assertOneDestination(inject(CPS_TELEMETRY_DESTINATIONS));

      const init = options?.init;
      if (!init) {
        return;
      }
      const instance = inject(sink);
      if (!initializedSinks.has(instance)) {
        initializedSinks.add(instance);
        cpsSafeVoid('destination.init', () => init(instance));
      }
    })
  ]);
}

/**
 * Fails bootstrap when more than one distinct destination is registered.
 * A configuration error, so it throws in every environment — the same rule
 * as a missing destination, which fails with `NG0201`.
 */
function assertOneDestination(destinations: Type<CpsTelemetrySink>[]): void {
  const distinct = [...new Set(destinations)];
  if (distinct.length > 1) {
    throw new Error(
      `[cps-telemetry] More than one telemetry destination is provided: ${distinct
        .map((d) => d.name)
        .join(', ')}. Provide exactly one.`
    );
  }
}

/**
 * Where a realm sends its telemetry, selectable via
 * {@link provideCpsTelemetrySink} without any optional peer dependency.
 * AWS RUM isn't one of these — it lives in its own entry point; see
 * {@link provideCpsTelemetryRumSink}.
 *
 * @group Types
 */
export type CpsTelemetryLocalSinkMode =
  /** To a shell realm running {@link provideCpsTelemetryBroadcastHost}. */
  | 'broadcast'
  /** Nowhere. Everything still runs; nothing is shipped. */
  | 'noop';

/**
 * Binds one of the library's own local destinations, through
 * {@link provideCpsTelemetryDestination}. Every application needs exactly
 * one destination — this, {@link provideCpsTelemetryRumSink}, or a sink of
 * its own.
 *
 * - `'broadcast'` forwards to a shell realm running
 *   {@link provideCpsTelemetryBroadcastHost}, on a channel both sides name
 *   identically. Log records go there too: this mode also binds
 *   {@link CPS_LOG_API_PROVIDER} to {@link CpsBroadcastLogApiProvider}, so
 *   the shell's log provider ships them and answers `query()`.
 * - `'noop'` discards everything.
 *
 * Sending straight to AWS CloudWatch RUM is `provideCpsTelemetryRumSink()`,
 * imported from `cps-telemetry/rum` — a separate entry point, not a third
 * mode here, so that an application using only `'broadcast'`/`'noop'` is
 * never required to have the optional `aws-rum-web` peer resolvable at
 * build time.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideCpsTelemetry({ application: 'cart', environment, version }),
 *   provideCpsTelemetrySink(environment.embedded ? 'broadcast' : 'noop')
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
  mode: CpsTelemetryLocalSinkMode,
  options?: { channelName?: string }
): EnvironmentProviders {
  switch (mode) {
    case 'broadcast':
      return makeEnvironmentProviders([
        provideCpsTelemetryDestination(CpsBroadcastTelemetrySink),
        CpsBroadcastLogApiProvider,
        {
          provide: CPS_LOG_API_PROVIDER,
          useExisting: CpsBroadcastLogApiProvider
        },
        ...(options?.channelName
          ? [{ provide: CPS_BROADCAST_CHANNEL, useValue: options.channelName }]
          : [])
      ]);

    case 'noop':
      return provideCpsTelemetryDestination(CpsNoopTelemetrySink);

    default:
      throw new Error(`[cps-telemetry] Unknown sink mode "${mode}".`);
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
