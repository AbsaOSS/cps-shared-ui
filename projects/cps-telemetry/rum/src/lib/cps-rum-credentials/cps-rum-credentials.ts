import { InjectionToken } from '@angular/core';

/**
 * Short-lived AWS credentials for the RUM data plane.
 *
 * @group Interfaces
 */
export interface CpsRumCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;

  /** ISO-8601 expiry. Used to schedule a refresh before the credentials lapse. */
  expiration: string;
}

/**
 * Mirrors `aws-rum-web`'s own `AwsCredentialIdentity | AwsCredentialIdentityProvider`
 * union — used only by {@link CpsRumAppMonitorConfig.clientBuilder}.
 */
type ClientBuilderCredentials =
  | { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
  | (() => Promise<{
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    }>);

/**
 * Settings for the RUM app monitor, mapped onto the underlying `aws-rum-web`
 * SDK's own `Config`. Every optional field left unset falls back to a
 * default: `allowCookies`, `enableXRay`, `endpoint` and `telemetries` fall
 * back to this library's own override; every other field falls back to the
 * SDK's own default (see `buildRumConfig()`).
 *
 * Matches the SDK's `Config` field for field, with three omissions:
 *
 * - `endpointUrl` — always recomputed by the SDK from `endpoint`; setting it
 *   independently has no effect.
 * - `identityPoolId`, `guestRoleArn` — the SDK's own Cognito guest-identity
 *   credential flow. AWS credentials come from a backend-vended
 *   `CpsRumCredentialsProvider` instead (see
 *   `CpsRumTelemetrySink.applyCredentials`).
 * - `sessionId`, `userId` — owned at runtime by `CpsRumTelemetrySink`'s
 *   `setUserId`, `pinUserId` and `startSession`.
 *
 * None of the field types below are imported from `aws-rum-web`; every type
 * here is hand-written. This keeps `aws-rum-web` an optional peer
 * dependency for applications that only use the `broadcast` or `noop` sink.
 *
 * @group Interfaces
 */
export interface CpsRumAppMonitorConfig {
  /** CloudWatch RUM app monitor id. */
  applicationId: string;

  /** AWS region hosting the app monitor, e.g. `eu-west-1`. */
  region: string;

  /** Version string reported with every event. */
  applicationVersion: string;

  // ---- Sampling & session ----

  /** Fraction of sessions recorded, `0`–`1`. Default `1`. */
  sessionSampleRate?: number;

  /** Session length before a new one begins, in seconds. Default `1800` (30 minutes). */
  sessionLengthSeconds?: number;

  /**
   * Hard cap on events recorded per session, across all telemetry. Default
   * `200`. See DESIGN.md §7.
   */
  sessionEventLimit?: number;

  /**
   * Suppresses the `session_start` event the SDK would otherwise emit at the
   * start of a session. Default `false`.
   */
  suppressSessionStartEvent?: boolean;

  /** Days an anonymous user id is retained in cookies/local storage. Default `30`. */
  userIdRetentionDays?: number;

  /**
   * Attributes attached to every event in the session, seeded at
   * construction. Default `{}`. `CpsRumTelemetrySink` merges `application`,
   * `environment` and `appVersion` on top of this after construction; those
   * three keys always win.
   */
  sessionAttributes?: Record<string, string | number | boolean>;

  /**
   * Attributes attached to every event for the lifetime of the app monitor
   * client, independent of session. Default unset.
   */
  applicationAttributes?: Record<string, string | number | boolean>;

  // ---- Telemetry collection & tracing ----

  /**
   * Built-in telemetry categories to enable. Defaults to errors, performance
   * and same-origin HTTP. The SDK's own default also includes `'replay'`
   * (session replay via `rrweb`); this library does not enable it by
   * default.
   */
  telemetries?: (string | (string | object)[])[];

  /**
   * Custom event plugins to load alongside the built-in telemetry, each
   * implementing `aws-rum-web`'s own `Plugin` interface. Default `[]`.
   */
  eventPluginsToLoad?: unknown[];

  /** Whether to emit X-Ray trace ids. Default `true`. */
  enableXRay?: boolean;

  /** Whether to emit W3C trace context ids alongside X-Ray's. Default `false`. */
  enableW3CTraceId?: boolean;

  /** Whether resource-timing events record the resource's URL. Default `true`. */
  recordResourceUrl?: boolean;

  // ---- Dispatch & buffering ----

  /** Data plane endpoint. Defaults to the regional RUM endpoint. */
  endpoint?: string;

  /** Extra headers sent with every dispatch request. Default unset. */
  headers?: Record<string, string>;

  /** Free-form label reported alongside dispatched events. Default unset. */
  alias?: string;

  /** Maximum events sent per dispatch request. Default `100`. */
  batchLimit?: number;

  /** Interval between automatic dispatches, in milliseconds. Default `5000`. */
  dispatchInterval?: number;

  /** Maximum events held in the in-memory cache awaiting dispatch. Default `1000`. */
  eventCacheSize?: number;

  /** Maximum not-yet-recorded candidate events cached. Default `10`. */
  candidatesCacheSize?: number;

  /** Retries for a failed dispatch request. Default `2`. */
  retries?: number;

  /** Whether unload-time flushes use `navigator.sendBeacon`. Default `true`. */
  useBeacon?: boolean;

  /**
   * Whether dispatch requests are SigV4-signed. Default `true`. Has no
   * effect unless paired with `identityPoolId`, which this library does not
   * expose; credentials come from `CpsRumCredentialsProvider` instead.
   */
  signing?: boolean;

  /** Whether the request body is gzip-compressed before dispatch. Default `{ enabled: true }`. */
  compressionStrategy?: { enabled: boolean };

  /**
   * Overrides the SDK's own `fetch`-based transport. Default unset — the
   * SDK uses the global `fetch`.
   */
  fetchFunction?: typeof fetch;

  /**
   * Overrides how the SDK builds its data-plane HTTP client. An advanced
   * escape hatch — see `aws-rum-web`'s own `ClientBuilder` type for the exact
   * signature (`(endpoint: URL, region: string, credentials?, compressionStrategy?) => DataPlaneClient`).
   * Default unset.
   */
  clientBuilder?: (
    endpoint: URL,
    region: string,
    credentials?: ClientBuilderCredentials,
    compressionStrategy?: { enabled: boolean }
  ) => unknown;

  // ---- Cookies & privacy ----

  /** Whether the client may use cookies for session continuity. Default `true`. */
  allowCookies?: boolean;

  /**
   * Overrides for the cookies the client sets. Unset fields fall back to the
   * SDK's own defaults (`domain` = current hostname, `path` = `/`,
   * `sameSite` = `'Strict'`, `secure` = `true`, `unique` = `false`).
   */
  cookieAttributes?: {
    unique?: boolean;
    domain?: string;
    path?: string;
    sameSite?: string;
    secure?: boolean;
  };

  // ---- Page tracking ----

  /**
   * Disables the client's own automatic page-view recording on navigation.
   * Pair with `CpsRumTelemetrySink.recordPageView()` to record page ids
   * yourself. Default `false`.
   */
  disableAutoPageView?: boolean;

  /** How the page id is derived from the URL. Default `'PATH'`. */
  pageIdFormat?: 'PATH' | 'HASH' | 'PATH_AND_HASH';

  /** Pages recorded, matched against the page id. Default matches every page. */
  pagesToInclude?: RegExp[];

  /** Pages excluded from recording, matched against the page id. Default `[]`. */
  pagesToExclude?: RegExp[];

  /** How long, in milliseconds, a route change waits before being considered complete. Default `100`. */
  routeChangeComplete?: number;

  /** Timeout, in milliseconds, before an incomplete route change is abandoned. Default `10000`. */
  routeChangeTimeout?: number;

  // ---- Advanced / escape hatches ----

  /**
   * Label reported as the SDK's own install method. Default is the SDK's
   * internal module-install constant; overriding it is rarely useful outside
   * of testing the SDK itself.
   */
  client?: string;

  /** Release identifier reported with every event, e.g. a build SHA. Default unset. */
  releaseId?: string;

  /** Logs the SDK's own internal diagnostics to the console. Default `false`. */
  debug?: boolean;

  /** Master switch for the RUM client. Default `true`. */
  enableRumClient?: boolean;
}

/**
 * The payload returned by a {@link CpsRumCredentialsProvider}.
 *
 * @group Interfaces
 */
export interface CpsRumBootstrap {
  /** App monitor settings. */
  config: CpsRumAppMonitorConfig;

  /**
   * Credentials for the data plane. Omit when the app monitor is configured for
   * unauthenticated access.
   */
  credentials?: CpsRumCredentials;
}

/**
 * What the RUM sink needs from the host application to start.
 *
 * Keeps the telemetry layer free of AWS account details — how the app
 * monitor id is discovered and how credentials are vended is entirely the
 * application's business.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class AppRumCredentialsProvider implements CpsRumCredentialsProvider {
 *   async load(): Promise<CpsRumBootstrap | null> {
 *     const res = await fetch('/rum/init');
 *     if (!res.ok) return null;
 *     const { enabled, config, credentials } = await res.json();
 *     return enabled ? { config, credentials } : null;
 *   }
 * }
 * ```
 *
 * @group Interfaces
 */
export interface CpsRumCredentialsProvider {
  /**
   * Resolves the app monitor settings and a set of credentials.
   *
   * Called once at startup and again shortly before each credential expiry.
   * Returning `null` disables RUM for the session — the telemetry layer stays
   * fully functional, it simply stops shipping.
   *
   * @returns the bootstrap payload, or `null` to disable RUM
   */
  load(): Promise<CpsRumBootstrap | null>;
}

/**
 * Binds the application's {@link CpsRumCredentialsProvider}.
 *
 * @group Tokens
 */
export const CPS_RUM_CREDENTIALS_PROVIDER =
  new InjectionToken<CpsRumCredentialsProvider>('CPS_RUM_CREDENTIALS_PROVIDER');
