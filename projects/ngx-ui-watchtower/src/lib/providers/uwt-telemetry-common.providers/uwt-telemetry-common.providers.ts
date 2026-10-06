import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Provider,
  provideAppInitializer,
  Type
} from '@angular/core';
import { UwtTelemetryBroadcastHost } from '../../sinks/uwt-broadcast/uwt-broadcast-host.service';
import { UwtBroadcastTelemetrySink } from '../../sinks/uwt-broadcast/uwt-broadcast-telemetry.sink';
import { UWT_BROADCAST_CHANNEL } from '../../sinks/uwt-broadcast/uwt-broadcast.messages';
import { UwtNoopTelemetrySink } from '../../sinks/uwt-telemetry/uwt-noop-telemetry.sink/uwt-noop-telemetry.sink';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import { UwtRedactConfig } from '../../utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';
import { UwtBroadcastLogApiProvider } from '../uwt-broadcast-log-api.provider/uwt-broadcast-log-api.provider';
import { UWT_LOG_API_PROVIDER } from '../uwt-log-api.provider/uwt-log-api.provider';
import { uwtSafeVoid } from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';
import {
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY,
  UWT_DEFAULT_TELEMETRY_CONFIG,
  UwtTelemetryIdentity
} from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import {
  UWT_BI_TELEMETRY_CONFIG,
  UwtBITelemetryConfig
} from '../../config/uwt-bi-telemetry.config/uwt-bi-telemetry.config';
import {
  UWT_LOG_CONFIG,
  UwtLogConfig
} from '../../config/uwt-log.config/uwt-log.config';
import {
  UWT_SCENARIO_TELEMETRY_CONFIG,
  UwtScenarioTelemetryConfig
} from '../../config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';

/**
 * One optional concern's providers, composed onto {@link provideUwtTelemetry}.
 *
 * Applications never construct one directly — only through `withLogging`,
 * `withScenarios`, `withBIEvents` or `withRedaction`.
 *
 * @group Types
 */
export interface UwtTelemetryFeature {
  providers: Provider[];
}

/**
 * Configures logging. Omit to take the library defaults.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideUwtTelemetry}
 *
 * @group Utils
 */
export function withLogging(
  config: Partial<UwtLogConfig> = {}
): UwtTelemetryFeature {
  return {
    providers: [
      {
        provide: UWT_LOG_CONFIG,
        useValue: { ...UWT_DEFAULT_TELEMETRY_CONFIG.logs, ...config }
      }
    ]
  };
}

/**
 * Configures scenario telemetry. Omit to take the library defaults.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideUwtTelemetry}
 *
 * @group Utils
 */
export function withScenarios(
  config: Partial<UwtScenarioTelemetryConfig> = {}
): UwtTelemetryFeature {
  return {
    providers: [
      {
        provide: UWT_SCENARIO_TELEMETRY_CONFIG,
        useValue: { ...UWT_DEFAULT_TELEMETRY_CONFIG.scenario, ...config }
      }
    ]
  };
}

/**
 * Configures BI event tracking. Omit to take the library defaults.
 *
 * @param config overrides merged over the library defaults
 * @returns a feature for {@link provideUwtTelemetry}
 *
 * @group Utils
 */
export function withBIEvents(
  config: Partial<UwtBITelemetryConfig> = {}
): UwtTelemetryFeature {
  return {
    providers: [
      {
        provide: UWT_BI_TELEMETRY_CONFIG,
        useValue: { ...UWT_DEFAULT_TELEMETRY_CONFIG.bi, ...config }
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
 * @returns a feature for {@link provideUwtTelemetry}
 *
 * @group Utils
 */
export function withRedaction(
  config: Partial<UwtRedactConfig> = {}
): UwtTelemetryFeature {
  const defaults = UWT_DEFAULT_TELEMETRY_CONFIG.redact;
  return {
    providers: [
      {
        provide: UWT_REDACT_CONFIG,
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
 * feature's token (e.g. {@link UWT_LOG_CONFIG}) can also be overridden
 * directly via plain DI substitution.
 *
 * Provides no destination. A sink and a log API provider must be bound
 * separately; injecting a telemetry service without them fails at bootstrap
 * with `NG0201`.
 *
 * @example
 * ```typescript
 * import { provideUwtTelemetryRumSink, UWT_RUM_CREDENTIALS_PROVIDER } from '@absaoss-cps/ngx-ui-watchtower/rum';
 *
 * providers: [
 *   provideUwtTelemetry(
 *     { application: 'composition', environment: 'prod', version: '22.0.0' },
 *     withLogging({ minLevel: 'warn' }),
 *     withScenarios({ maxSteps: 10 })
 *   ),
 *   provideUwtTelemetryRumSink(),
 *   { provide: UWT_LOG_API_PROVIDER, useExisting: MyLogApiProvider },
 *
 *   { provide: UWT_RUM_CREDENTIALS_PROVIDER, useExisting: AppRumCredentials }
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
export function provideUwtTelemetry(
  identity: UwtTelemetryIdentity,
  ...features: UwtTelemetryFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: UWT_TELEMETRY_IDENTITY,
      useValue: {
        application: identity.application,
        environment: identity.environment,
        version: identity.version,
        eventNamespace:
          identity.eventNamespace || UWT_DEFAULT_TELEMETRY_CONFIG.eventNamespace
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
 * Every destination registered through {@link provideUwtTelemetryDestination},
 * so bootstrap can insist on exactly one. Internal.
 */
const UWT_TELEMETRY_DESTINATIONS = new InjectionToken<Type<UwtTelemetrySink>[]>(
  'UWT_TELEMETRY_DESTINATIONS'
);

/** Sinks whose `init` already ran — the same destination may be listed twice. */
const initializedSinks = new WeakSet<UwtTelemetrySink>();

/**
 * Options for {@link provideUwtTelemetryDestination}.
 *
 * @group Interfaces
 */
export interface UwtTelemetryDestinationOptions<T extends UwtTelemetrySink> {
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
 * ({@link provideUwtTelemetryRumSink}), `'broadcast'` and `'noop'`
 * ({@link provideUwtTelemetrySink}), and any sink an application or another
 * package writes. Swapping destinations is swapping this one call;
 * application code doesn't change.
 *
 * Exactly one destination is allowed. Registering two different ones fails
 * at bootstrap, rather than silently keeping whichever came last.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideUwtTelemetry({ application: 'my-app', environment, version }),
 *   provideUwtTelemetryDestination(MyBackendSink, { init: (sink) => sink.start() }),
 *   { provide: UWT_LOG_API_PROVIDER, useExisting: MyLogBackend }
 * ]
 * ```
 *
 * @param sink the destination's class; it is provided here too
 * @param options optional startup hook
 * @returns providers binding {@link UwtTelemetrySink} to `sink`
 *
 * @group Utils
 */
export function provideUwtTelemetryDestination<T extends UwtTelemetrySink>(
  sink: Type<T>,
  options?: UwtTelemetryDestinationOptions<T>
): EnvironmentProviders {
  return makeEnvironmentProviders([
    sink,
    { provide: UwtTelemetrySink, useExisting: sink },
    { provide: UWT_TELEMETRY_DESTINATIONS, useValue: sink, multi: true },
    provideAppInitializer(() => {
      assertOneDestination(inject(UWT_TELEMETRY_DESTINATIONS));

      const init = options?.init;
      if (!init) {
        return;
      }
      const instance = inject(sink);
      if (!initializedSinks.has(instance)) {
        initializedSinks.add(instance);
        uwtSafeVoid('destination.init', () => init(instance));
      }
    })
  ]);
}

/**
 * Fails bootstrap when more than one distinct destination is registered.
 * A configuration error, so it throws in every environment — the same rule
 * as a missing destination, which fails with `NG0201`.
 */
function assertOneDestination(destinations: Type<UwtTelemetrySink>[]): void {
  const distinct = [...new Set(destinations)];
  if (distinct.length > 1) {
    throw new Error(
      `[ngx-ui-watchtower] More than one telemetry destination is provided: ${distinct
        .map((d) => d.name)
        .join(', ')}. Provide exactly one.`
    );
  }
}

/**
 * Where a realm sends its telemetry, selectable via
 * {@link provideUwtTelemetrySink} without any optional peer dependency.
 * AWS RUM isn't one of these — it lives in its own entry point; see
 * {@link provideUwtTelemetryRumSink}.
 *
 * @group Types
 */
export type UwtTelemetryLocalSinkMode =
  /** To a shell realm running {@link provideUwtTelemetryBroadcastHost}. */
  | 'broadcast'
  /** Nowhere. Everything still runs; nothing is shipped. */
  | 'noop';

/**
 * Binds one of the library's own local destinations, through
 * {@link provideUwtTelemetryDestination}. Every application needs exactly
 * one destination — this, {@link provideUwtTelemetryRumSink}, or a sink of
 * its own.
 *
 * - `'broadcast'` forwards to a shell realm running
 *   {@link provideUwtTelemetryBroadcastHost}, on a channel both sides name
 *   identically. Log records go there too: this mode also binds
 *   {@link UWT_LOG_API_PROVIDER} to {@link UwtBroadcastLogApiProvider}, so
 *   the shell's log provider ships them and answers `query()`.
 * - `'noop'` discards everything.
 *
 * Sending straight to AWS CloudWatch RUM is `provideUwtTelemetryRumSink()`,
 * imported from `@absaoss-cps/ngx-ui-watchtower/rum` — a separate entry point, not a third
 * mode here, so that an application using only `'broadcast'`/`'noop'` is
 * never required to have the optional `aws-rum-web` peer resolvable at
 * build time.
 *
 * @example
 * ```typescript
 * providers: [
 *   provideUwtTelemetry({ application: 'cart', environment, version }),
 *   provideUwtTelemetrySink(environment.embedded ? 'broadcast' : 'noop')
 * ]
 * ```
 *
 * @param mode where this realm should send telemetry
 * @param options `channelName` for `broadcast` mode; must match the host's
 * @returns providers wiring the chosen sink
 *
 * @group Utils
 */
export function provideUwtTelemetrySink(
  mode: UwtTelemetryLocalSinkMode,
  options?: { channelName?: string }
): EnvironmentProviders {
  switch (mode) {
    case 'broadcast':
      return makeEnvironmentProviders([
        provideUwtTelemetryDestination(UwtBroadcastTelemetrySink),
        UwtBroadcastLogApiProvider,
        {
          provide: UWT_LOG_API_PROVIDER,
          useExisting: UwtBroadcastLogApiProvider
        },
        ...(options?.channelName
          ? [{ provide: UWT_BROADCAST_CHANNEL, useValue: options.channelName }]
          : [])
      ]);

    case 'noop':
      return provideUwtTelemetryDestination(UwtNoopTelemetrySink);

    default:
      throw new Error(`[ngx-ui-watchtower] Unknown sink mode "${mode}".`);
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
export function provideUwtTelemetryBroadcastHost(
  channelName?: string
): EnvironmentProviders {
  return makeEnvironmentProviders([
    UwtTelemetryBroadcastHost,
    ...(channelName
      ? [{ provide: UWT_BROADCAST_CHANNEL, useValue: channelName }]
      : []),
    // Constructed eagerly so it is listening before any fragment sends.
    provideAppInitializer(() => {
      inject(UwtTelemetryBroadcastHost);
    })
  ]);
}
