import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy } from '@angular/core';
import type { AwsRum, AwsRumConfig } from 'aws-rum-web';
import {
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY,
  CpsTelemetryError,
  CpsTelemetryMetadata,
  CpsTelemetrySink,
  cpsNormalizeError
} from 'cps-telemetry';
import {
  cpsIsBrowser,
  cpsIsDevMode,
  cpsSafe,
  cpsSafeVoid,
  cpsUuid
} from '../cps-rum-internal.util/cps-rum-internal.util';
import {
  CPS_RUM_CREDENTIALS_PROVIDER,
  CpsRumBootstrap,
  CpsRumCredentials
} from '../cps-rum-credentials/cps-rum-credentials';

/** Refresh credentials this long before they expire. */
const CREDENTIAL_REFRESH_SKEW_MS = 5 * 60 * 1000;

/**
 * Maximum delay supported by setTimeout (2^31 - 1 ms, ~24.85 days).
 * Prevents 32-bit signed integer overflow triggering an immediate execution.
 */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Retry delay after a scheduled refresh fails or returns no credentials.
 * Shorter than the normal refresh-ahead-of-expiry interval.
 */
const CREDENTIAL_RETRY_DELAY_MS = 30 * 1000;

/**
 * Events retained while the SDK loads. Bounded so a failed init cannot
 * grow the buffer without limit.
 */
const PRE_INIT_BUFFER_LIMIT = 100;

/** Metadata keys under this prefix are reserved by the RUM client. */
const RESERVED_PREFIX = 'aws:';

interface BufferedEvent {
  kind: 'event';
  eventType: string;
  payload: object;
  metadata?: CpsTelemetryMetadata;
}

interface BufferedPageView {
  kind: 'pageView';
  pageId: string;
}

interface BufferedError {
  kind: 'error';
  error: CpsTelemetryError;
  metadata?: CpsTelemetryMetadata;
}

/** Anything the pre-init buffer holds. */
type BufferedItem = BufferedEvent | BufferedPageView | BufferedError;

/**
 * Drops every key whose value is `undefined`.
 *
 * Used to build the SDK config object from optional consumer fields: a key
 * present with value `undefined` would overwrite the SDK's own default for
 * that key, so unset fields must be absent rather than `undefined`.
 */
function omitUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Telemetry sink backed by the AWS CloudWatch RUM web client.
 *
 * Custom scenario and BI events travel through `recordEvent`, alongside the
 * page views, web vitals, JS errors, HTTP failures and resource timing the
 * client records on its own. The SDK is imported lazily, so an application
 * that never provides this sink never pays for the bundle. Every operation
 * is fail-open: if the broker is down, credentials lapse, or the SDK
 * throws, the application behaves as if RUM were healthy.
 *
 * @group Services
 */
@Injectable()
export class CpsRumTelemetrySink extends CpsTelemetrySink implements OnDestroy {
  private readonly config = inject(CPS_TELEMETRY_IDENTITY);
  private readonly redact = inject(CPS_REDACT_CONFIG);
  private readonly credentialsProvider = inject(CPS_RUM_CREDENTIALS_PROVIDER);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = cpsIsBrowser();

  private awsRum: AwsRum | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private buffer: BufferedItem[] = [];
  private userId?: string;
  /** Set once a refresh returns null/undefined; distinct from `!awsRum` alone. */
  private disabled = false;
  /**
   * Set once real credentials have ever been applied to `awsRum`. The AWS
   * RUM client has no API to clear already-applied credentials, so this
   * distinguishes "never authenticated" from "was
   * authenticated".
   */
  private hasAppliedCredentials = false;
  /**
   * Memoized so every caller — `provideCpsTelemetrySink('rum')`'s
   * `APP_INITIALIZER`, {@link ensureInitialized}, and a caller awaiting
   * `init()` directly — awaits the same underlying work, regardless of who
   * triggered it first.
   */
  private initPromise?: Promise<void>;
  /**
   * Set once in `ngOnDestroy`. `refreshCredentials()` nulls `refreshTimer`
   * before its own `await`, so a destroy during that window would leave a
   * new timer nothing could clear. Checked after every await in the
   * refresh chain instead.
   */
  private destroyed = false;

  /**
   * Loads and starts the RUM client.
   *
   * Fire-and-forget: it must never block bootstrap and never reject into the
   * caller. Safe to call more than once; subsequent calls are no-ops.
   *
   * @returns a promise that resolves once initialization has been attempted
   */
  async init(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    if (!this.initPromise) {
      this.initPromise = this.performInit();
    }
    return this.initPromise;
  }

  private async performInit(): Promise<void> {
    try {
      const bootstrap = await this.credentialsProvider.load();
      if (!bootstrap?.config) {
        this.disableAwsRum();
        this.buffer = [];
        return;
      }

      const { AwsRum } = await import('aws-rum-web');
      if (this.destroyed) {
        return;
      }

      this.awsRum = new AwsRum(
        bootstrap.config.applicationId,
        bootstrap.config.applicationVersion,
        bootstrap.config.region,
        this.buildRumConfig(bootstrap)
      );

      this.applyIdentity();
      this.applyCredentials(bootstrap.credentials);
      this.replayBuffer();
    } catch (error) {
      this.disableAwsRum();
      this.buffer = [];
      this.reportFailure('RUM init failed, monitoring disabled', error);
    }
  }

  /**
   * Kicks off `init()` on first real use, for a sink bound directly (e.g.
   * `{ provide: CpsTelemetrySink, useClass: CpsRumTelemetrySink }`) rather
   * than through `provideCpsTelemetrySink('rum')`, which is what normally
   * calls `init()` via `APP_INITIALIZER`. `init()` is idempotent and
   * memoized, so this is a no-op once already initialized or already in
   * flight, and never races with a caller awaiting `init()` directly.
   */
  private ensureInitialized(): void {
    if (!this.initPromise) {
      this.init().catch(() => undefined);
    }
  }

  /**
   * Shared shape behind {@link record}, {@link recordError} and
   * {@link recordPageView}: kicks off init, then either buffers `item`
   * (pre-init) or hands the live client to `dispatch`, all inside the same
   * fail-open guard.
   */
  private recordOrBuffer(
    operation: string,
    item: BufferedItem,
    dispatch: (awsRum: AwsRum) => void
  ): void {
    this.ensureInitialized();
    cpsSafeVoid(operation, () => {
      if (!this.isBrowser || this.disabled) {
        return;
      }

      const awsRum = this.awsRum;
      if (!awsRum) {
        this.bufferItem(item);
        return;
      }

      dispatch(awsRum);
    });
  }

  /** @inheritdoc */
  record(
    eventType: string,
    payload: object,
    metadata?: CpsTelemetryMetadata
  ): void {
    this.recordOrBuffer(
      'rum.record',
      { kind: 'event', eventType, payload, metadata },
      (awsRum) =>
        awsRum.recordEvent(eventType, payload, this.sanitize(metadata))
    );
  }

  /** @inheritdoc */
  recordError(error: CpsTelemetryError, metadata?: CpsTelemetryMetadata): void {
    this.recordOrBuffer(
      'rum.recordError',
      { kind: 'error', error, metadata },
      (awsRum) => awsRum.recordError(this.withOrigin(error, metadata))
    );
  }

  /** @inheritdoc */
  getSessionId(): string | undefined {
    return cpsSafe(
      'rum.getSessionId',
      () => this.awsRum?.getSessionId(),
      undefined
    );
  }

  /**
   * Associates subsequent events with a user, or with nobody.
   *
   * Signing in pins the id, and works even before `init()` resolves.
   * Signing out starts a fresh session with a new anonymous id (`pinUserId`
   * has no inverse), which emits a `session_start` event and re-rolls
   * sampling.
   *
   * @param userId the application's own user identifier, or `undefined` on
   *   sign-out
   */
  setUserId(userId: string | undefined): void {
    cpsSafeVoid('rum.setUserId', () => {
      this.userId = userId;

      if (userId) {
        this.awsRum?.pinUserId(userId);
        return;
      }

      this.awsRum?.startSession({ userId: cpsUuid() });
    });
  }

  /** @inheritdoc */
  getUserId(): string | undefined {
    return this.userId;
  }

  /** @inheritdoc */
  flush(beacon = false): void {
    cpsSafeVoid('rum.flush', () => {
      if (!this.awsRum) {
        if (this.buffer.length > 0 && cpsIsDevMode()) {
          // eslint-disable-next-line no-console
          console.warn(
            `[cps-telemetry] ${this.buffer.length} RUM event(s) lost: page unloaded before RUM finished initializing`
          );
        }
        return;
      }

      if (beacon) {
        this.awsRum.dispatchBeacon();
      } else {
        this.awsRum.dispatch();
      }
    });
  }

  /**
   * Records a page view.
   *
   * The RUM client already records a page view on every navigation via
   * `history.pushState`, covering Angular's router automatically. Use this
   * to report a different page id (e.g. a route template instead of the
   * resolved URL); also set `disableAutoPageView: true` in the RUM config
   * to avoid recording the navigation twice. Buffered like {@link record}
   * when called before `init()` resolves.
   *
   * @param pageId the page identity, e.g. `/customers/:id`
   */
  recordPageView(pageId: string): void {
    this.recordOrBuffer(
      'rum.recordPageView',
      { kind: 'pageView', pageId },
      (awsRum) => awsRum.recordPageView(pageId)
    );
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.disableAwsRum();
  }

  /**
   * Disables the sink: stops the AWS RUM client's own listeners, plugins,
   * and dispatch timer before dropping the reference — clearing `awsRum`
   * alone only stops this class from talking to it; the already-constructed
   * instance would otherwise keep running orphaned in the page (and, on
   * destroy, could duplicate telemetry if the app is bootstrapped again in
   * the same one) — and marks the session disabled, so every call site that
   * tears the client down does so atomically with the flag `recordOrBuffer`
   * checks, instead of each caller having to remember to set both.
   */
  private disableAwsRum(): void {
    cpsSafeVoid('rum.disable', () => this.awsRum?.disable());
    this.awsRum = null;
    this.disabled = true;
  }

  /**
   * Maps {@link CpsRumAppMonitorConfig} onto the SDK's own `PartialConfig`.
   *
   * The SDK merges this object over its own defaults with a shallow
   * `Object.assign`, so a key present with value `undefined` overwrites the
   * SDK's default instead of falling through to it. `allowCookies`,
   * `enableXRay`, `endpoint` and `telemetries` always carry this library's
   * own override; every other field goes through {@link omitUndefined} (or,
   * for `client`, a conditional spread) so an unset field is absent and the
   * SDK's own default applies.
   */
  private buildRumConfig(bootstrap: CpsRumBootstrap): AwsRumConfig {
    const { config } = bootstrap;
    const origin = this.document.defaultView?.location?.origin ?? '';

    // X-Ray trace header only on same-origin requests; a cross-origin
    // request with an unexpected header fails CORS preflight. Anchored at
    // both ends (with a path/query/fragment/end-of-string lookahead) so
    // `https://example.com` doesn't also match a look-alike host like
    // `https://example.com.attacker.example`.
    const sameOrigin = new RegExp(
      '^' + origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[/?#]|$)'
    );

    return {
      allowCookies: config.allowCookies ?? true,
      enableXRay: config.enableXRay ?? true,
      endpoint:
        config.endpoint ??
        `https://dataplane.rum.${config.region}.amazonaws.com`,
      telemetries: config.telemetries ?? [
        'errors',
        'performance',
        ['http', { addXRayTraceIdHeader: [sameOrigin] }]
      ],

      ...(config.client !== undefined ? { client: config.client } : {}),

      ...omitUndefined({
        releaseId: config.releaseId,
        clientBuilder: config.clientBuilder,
        applicationAttributes: config.applicationAttributes,
        alias: config.alias,
        headers: config.headers,
        cookieAttributes: config.cookieAttributes,
        sessionSampleRate: config.sessionSampleRate,
        sessionLengthSeconds: config.sessionLengthSeconds,
        sessionEventLimit: config.sessionEventLimit,
        suppressSessionStartEvent: config.suppressSessionStartEvent,
        userIdRetentionDays: config.userIdRetentionDays,
        sessionAttributes: config.sessionAttributes,
        eventPluginsToLoad: config.eventPluginsToLoad,
        enableW3CTraceId: config.enableW3CTraceId,
        recordResourceUrl: config.recordResourceUrl,
        batchLimit: config.batchLimit,
        dispatchInterval: config.dispatchInterval,
        eventCacheSize: config.eventCacheSize,
        candidatesCacheSize: config.candidatesCacheSize,
        retries: config.retries,
        useBeacon: config.useBeacon,
        signing: config.signing,
        compressionStrategy: config.compressionStrategy,
        fetchFunction: config.fetchFunction,
        pageIdFormat: config.pageIdFormat,
        pagesToInclude: config.pagesToInclude,
        pagesToExclude: config.pagesToExclude,
        routeChangeComplete: config.routeChangeComplete,
        routeChangeTimeout: config.routeChangeTimeout,
        disableAutoPageView: config.disableAutoPageView,
        debug: config.debug,
        enableRumClient: config.enableRumClient
      })
    } as unknown as AwsRumConfig;
  }

  /**
   * Attaches application identity once per session rather than once per event.
   *
   * `addSessionAttributes` covers custom events; the metadata hook stamps
   * the same attributes onto the client's own built-in events too.
   *
   * See {@link CpsRumAppMonitorConfig.sessionAttributes} for how this
   * merges with a consumer-supplied base.
   */
  private applyIdentity(): void {
    if (!this.awsRum) {
      return;
    }

    const attributes = {
      application: this.config.application,
      environment: this.config.environment,
      appVersion: this.config.version
    };

    this.awsRum.addSessionAttributes(attributes);
    this.awsRum.setEventMetadataHook(() => attributes);

    if (this.userId) {
      this.awsRum.pinUserId(this.userId);
    }
  }

  private applyCredentials(credentials?: CpsRumCredentials): void {
    if (!this.awsRum || !credentials) {
      return;
    }

    this.awsRum.setAwsCredentials({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    this.hasAppliedCredentials = true;

    this.scheduleRefresh(credentials.expiration);
  }

  private scheduleRefresh(expiration: string): void {
    const delay =
      new Date(expiration).getTime() - Date.now() - CREDENTIAL_REFRESH_SKEW_MS;

    if (!Number.isFinite(delay) || delay <= 0) {
      // Avoid tight-looping on an already-expired/unparsable expiration.
      this.scheduleRetry();
      return;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(
      () => {
        this.refreshCredentials().catch(() => undefined);
      },
      Math.min(delay, MAX_TIMEOUT_MS)
    );
  }

  private async refreshCredentials(): Promise<void> {
    this.refreshTimer = null;
    try {
      const bootstrap = await this.credentialsProvider.load();
      if (this.destroyed) {
        return;
      }

      if (!bootstrap) {
        // null/undefined disables RUM for the session (see load()'s contract).
        this.disableAwsRum();
        return;
      }

      // Omitted credentials mean unauthenticated access, not a failure —
      // but only for a session that was never authenticated.
      if (bootstrap.credentials) {
        this.applyCredentials(bootstrap.credentials);
      } else if (this.hasAppliedCredentials) {
        this.scheduleRetry();
        this.reportFailure(
          'RUM credential refresh',
          new Error(
            'bootstrap omitted credentials for an already-authenticated ' +
              'session; keeping existing credentials and retrying'
          )
        );
      }
    } catch (error) {
      if (!this.destroyed) {
        this.scheduleRetry();
        this.reportFailure('RUM credential refresh failed', error);
      }
    }
  }

  private scheduleRetry(): void {
    if (this.destroyed) {
      return;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshCredentials().catch(() => undefined);
    }, CREDENTIAL_RETRY_DELAY_MS);
  }

  /**
   * Reports an init/refresh failure without leaking raw error content into
   * the production console.
   */
  private reportFailure(operation: string, error: unknown): void {
    if (!cpsIsDevMode()) {
      return;
    }
    cpsSafeVoid('rum.reportFailure', () => {
      // eslint-disable-next-line no-console
      console.warn(
        `[cps-telemetry] ${operation}`,
        cpsNormalizeError(error, this.redact)
      );
    });
  }

  private bufferItem(item: BufferedItem): void {
    this.buffer.push(item);
    if (this.buffer.length > PRE_INIT_BUFFER_LIMIT) {
      this.buffer.shift();
    }
  }

  private replayBuffer(): void {
    const pending = this.buffer;
    this.buffer = [];

    for (const item of pending) {
      cpsSafeVoid('rum.replay', () => {
        if (item.kind === 'event') {
          this.awsRum?.recordEvent(
            item.eventType,
            item.payload,
            this.sanitize(item.metadata)
          );
        } else if (item.kind === 'pageView') {
          this.awsRum?.recordPageView(item.pageId);
        } else {
          this.awsRum?.recordError(this.withOrigin(item.error, item.metadata));
        }
      });
    }
  }

  /**
   * Drops metadata keys under the reserved `aws:` prefix, which the client
   * would otherwise discard with a console warning. Also drops `null`
   * values, which {@link CpsTelemetryMetadata} permits but the SDK's
   * metadata type does not.
   */
  private sanitize(
    metadata?: CpsTelemetryMetadata
  ): Record<string, string | number | boolean> | undefined {
    if (!metadata) {
      return undefined;
    }

    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (key.startsWith(RESERVED_PREFIX) || value === null) {
        continue;
      }
      result[key] = value;
    }

    return Object.keys(result).length ? result : undefined;
  }

  /**
   * Folds a forwarded error's origin into its name. `AwsRum.recordError`
   * takes no metadata argument, so `name` is the only field left to carry it.
   */
  private withOrigin(
    error: CpsTelemetryError,
    metadata?: CpsTelemetryMetadata
  ): CpsTelemetryError {
    const origin = metadata?.application;
    if (typeof origin !== 'string' || origin === this.config.application) {
      return error;
    }
    return { ...error, name: `[${origin}] ${error.name}` };
  }
}
