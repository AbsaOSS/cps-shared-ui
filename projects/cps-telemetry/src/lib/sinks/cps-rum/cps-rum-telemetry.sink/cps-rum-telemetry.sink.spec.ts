import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CPS_DEFAULT_TELEMETRY_CONFIG,
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY
} from '../../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import {
  CPS_RUM_CREDENTIALS_PROVIDER,
  CpsRumBootstrap
} from '../cps-rum-credentials/cps-rum-credentials';
import { CpsRumTelemetrySink } from './cps-rum-telemetry.sink';
import { CPS_TELEMETRY_EVENT_TYPE } from '../../../models/cps-telemetry-common.models/cps-telemetry-common.models';

/** Stand-in for the real `AwsRum` client. */
const awsRumInstance = {
  recordEvent: jest.fn(),
  recordError: jest.fn(),
  recordPageView: jest.fn(),
  addSessionAttributes: jest.fn(),
  setEventMetadataHook: jest.fn(),
  setAwsCredentials: jest.fn(),
  pinUserId: jest.fn(),
  startSession: jest.fn(() => 'rum-session-2'),
  getSessionId: jest.fn(() => 'rum-session-1'),
  dispatch: jest.fn(),
  dispatchBeacon: jest.fn()
};

// Typed on the real `new AwsRum(applicationId, applicationVersion, region,
// config)` signature so `.mock.calls[0][3]` typechecks.
const AwsRumCtor = jest.fn(
  (
    _applicationId: string,
    _applicationVersion: string,
    _region: string,
    _config: unknown
  ) => awsRumInstance
);

jest.mock(
  'aws-rum-web',
  () => ({
    AwsRum: function (this: unknown, ...args: unknown[]) {
      return AwsRumCtor(...(args as Parameters<typeof AwsRumCtor>));
    }
  }),
  { virtual: true }
);

function bootstrap(
  overrides?: Partial<CpsRumBootstrap['config']>,
  expiresInMs = 60 * 60 * 1000
): CpsRumBootstrap {
  return {
    config: {
      applicationId: 'app-monitor-1',
      region: 'eu-west-1',
      applicationVersion: '1.0.0',
      ...overrides
    },
    credentials: {
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      sessionToken: 'token',
      expiration: new Date(Date.now() + expiresInMs).toISOString()
    }
  };
}

describe('CpsRumTelemetrySink', () => {
  let sink: CpsRumTelemetrySink;
  let load: jest.Mock;

  function configure(options?: {
    platformId?: object;
    loadImpl?: () => Promise<CpsRumBootstrap | null>;
  }): void {
    load = jest.fn(options?.loadImpl ?? (async () => bootstrap()));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CPS_TELEMETRY_IDENTITY,
          useValue: {
            application: 'test-app',
            environment: 'prod',
            version: '3.0.0'
          }
        },
        {
          provide: CPS_REDACT_CONFIG,
          useValue: CPS_DEFAULT_TELEMETRY_CONFIG.redact
        },
        { provide: PLATFORM_ID, useValue: options?.platformId ?? 'browser' },
        { provide: CPS_RUM_CREDENTIALS_PROVIDER, useValue: { load } },
        CpsRumTelemetrySink
      ]
    });
    sink = TestBed.inject(CpsRumTelemetrySink);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    configure();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should construct the client with the broker-supplied identity', async () => {
      await sink.init();

      expect(AwsRumCtor).toHaveBeenCalledWith(
        'app-monitor-1',
        '1.0.0',
        'eu-west-1',
        expect.objectContaining({
          endpoint: 'https://dataplane.rum.eu-west-1.amazonaws.com'
        })
      );
    });

    it('should enable the built-in errors, performance and http telemetries', async () => {
      await sink.init();

      const config = AwsRumCtor.mock.calls[0][3] as { telemetries: unknown[] };
      expect(config.telemetries[0]).toBe('errors');
      expect(config.telemetries[1]).toBe('performance');
      expect(config.telemetries[2]).toEqual([
        'http',
        { addXRayTraceIdHeader: [expect.any(RegExp)] }
      ]);
    });

    it('should scope the X-Ray trace header to the exact origin, not a look-alike host', async () => {
      await sink.init();

      const config = AwsRumCtor.mock.calls[0][3] as {
        telemetries: [
          string,
          string,
          [string, { addXRayTraceIdHeader: RegExp[] }]
        ];
      };
      const sameOrigin = config.telemetries[2][1].addXRayTraceIdHeader[0];
      const origin = window.location.origin;

      expect(sameOrigin.test(`${origin}/api/customers`)).toBe(true);
      expect(sameOrigin.test(origin)).toBe(true);
      expect(sameOrigin.test(`${origin}.attacker.example/api`)).toBe(false);
    });

    it('should honour explicitly supplied app monitor settings', async () => {
      configure({
        loadImpl: async () =>
          bootstrap({
            sessionSampleRate: 0.1,
            endpoint: 'https://custom.example.com',
            telemetries: ['errors'],
            allowCookies: false,
            enableXRay: false
          })
      });
      await sink.init();

      expect(AwsRumCtor.mock.calls[0][3]).toMatchObject({
        sessionSampleRate: 0.1,
        endpoint: 'https://custom.example.com',
        telemetries: ['errors'],
        allowCookies: false,
        enableXRay: false
      });
    });

    it('should honour a representative sample of advanced app monitor settings', async () => {
      configure({
        loadImpl: async () =>
          bootstrap({
            sessionLengthSeconds: 3600,
            sessionEventLimit: 500,
            suppressSessionStartEvent: true,
            applicationAttributes: { tier: 'gold' },
            eventPluginsToLoad: [{ id: 'custom' }],
            enableW3CTraceId: true,
            headers: { 'x-test': '1' },
            batchLimit: 50,
            signing: false,
            compressionStrategy: { enabled: false },
            cookieAttributes: { sameSite: 'Lax' },
            disableAutoPageView: true,
            pageIdFormat: 'HASH',
            pagesToExclude: [/^\/admin/],
            client: 'custom-client',
            releaseId: 'abc123',
            debug: true
          })
      });
      await sink.init();

      expect(AwsRumCtor.mock.calls[0][3]).toMatchObject({
        sessionLengthSeconds: 3600,
        sessionEventLimit: 500,
        suppressSessionStartEvent: true,
        applicationAttributes: { tier: 'gold' },
        eventPluginsToLoad: [{ id: 'custom' }],
        enableW3CTraceId: true,
        headers: { 'x-test': '1' },
        batchLimit: 50,
        signing: false,
        compressionStrategy: { enabled: false },
        cookieAttributes: { sameSite: 'Lax' },
        disableAutoPageView: true,
        pageIdFormat: 'HASH',
        pagesToExclude: [/^\/admin/],
        client: 'custom-client',
        releaseId: 'abc123',
        debug: true
      });
    });

    it('should pass through every SDK-default-mirroring field the representative-sample test above leaves uncovered', async () => {
      const fetchFunction = async () => new Response();

      configure({
        loadImpl: async () =>
          bootstrap({
            userIdRetentionDays: 30,
            sessionAttributes: { plan: 'enterprise' },
            recordResourceUrl: false,
            dispatchInterval: 5000,
            eventCacheSize: 200,
            candidatesCacheSize: 100,
            retries: 3,
            useBeacon: false,
            fetchFunction,
            pagesToInclude: [/^\/dashboard/],
            routeChangeComplete: 500,
            routeChangeTimeout: 2000,
            enableRumClient: false
          })
      });
      await sink.init();

      expect(AwsRumCtor.mock.calls[0][3]).toMatchObject({
        userIdRetentionDays: 30,
        sessionAttributes: { plan: 'enterprise' },
        recordResourceUrl: false,
        dispatchInterval: 5000,
        eventCacheSize: 200,
        candidatesCacheSize: 100,
        retries: 3,
        useBeacon: false,
        fetchFunction,
        pagesToInclude: [/^\/dashboard/],
        routeChangeComplete: 500,
        routeChangeTimeout: 2000,
        enableRumClient: false
      });
    });

    it('should keep its own literal default only for the fields it deliberately overrides', async () => {
      await sink.init();

      expect(AwsRumCtor.mock.calls[0][3]).toMatchObject({
        allowCookies: true,
        enableXRay: true,
        endpoint: 'https://dataplane.rum.eu-west-1.amazonaws.com',
        telemetries: [
          'errors',
          'performance',
          ['http', { addXRayTraceIdHeader: [expect.any(RegExp)] }]
        ]
      });
    });

    it('should omit every SDK-default-mirroring field entirely when unset, not send it as undefined', async () => {
      await sink.init();

      const config = AwsRumCtor.mock.calls[0][3] as Record<string, unknown>;
      const omittedWhenUnset = [
        'sessionSampleRate',
        'sessionLengthSeconds',
        'sessionEventLimit',
        'suppressSessionStartEvent',
        'userIdRetentionDays',
        'sessionAttributes',
        'eventPluginsToLoad',
        'enableW3CTraceId',
        'recordResourceUrl',
        'batchLimit',
        'dispatchInterval',
        'eventCacheSize',
        'candidatesCacheSize',
        'retries',
        'useBeacon',
        'signing',
        'compressionStrategy',
        'fetchFunction',
        'pageIdFormat',
        'pagesToInclude',
        'pagesToExclude',
        'routeChangeComplete',
        'routeChangeTimeout',
        'disableAutoPageView',
        'debug',
        'enableRumClient',
        'client',
        'applicationAttributes',
        'headers',
        'alias',
        'releaseId',
        'clientBuilder',
        'cookieAttributes'
      ];

      for (const field of omittedWhenUnset) {
        expect(Object.prototype.hasOwnProperty.call(config, field)).toBe(false);
      }
    });

    it('should pass every SDK-default-mirroring field through untouched when the consumer sets it', async () => {
      configure({
        loadImpl: async () =>
          bootstrap({
            sessionSampleRate: 0.5,
            sessionEventLimit: 500,
            pageIdFormat: 'HASH',
            debug: true
          })
      });
      await sink.init();

      expect(AwsRumCtor.mock.calls[0][3]).toMatchObject({
        sessionSampleRate: 0.5,
        sessionEventLimit: 500,
        pageIdFormat: 'HASH',
        debug: true
      });
    });

    it('should include client only when explicitly set', async () => {
      configure({
        loadImpl: async () => bootstrap({ client: 'custom-client' })
      });
      await sink.init();

      expect(AwsRumCtor.mock.calls[0][3]).toMatchObject({
        client: 'custom-client'
      });
    });

    it('should apply the credentials from the broker', async () => {
      await sink.init();

      expect(awsRumInstance.setAwsCredentials).toHaveBeenCalledWith({
        accessKeyId: 'AKIA',
        secretAccessKey: 'secret',
        sessionToken: 'token'
      });
    });

    it('should stamp application identity as session attributes and a metadata hook', async () => {
      await sink.init();

      const attributes = {
        application: 'test-app',
        environment: 'prod',
        appVersion: '3.0.0'
      };
      expect(awsRumInstance.addSessionAttributes).toHaveBeenCalledWith(
        attributes
      );
      expect(awsRumInstance.setEventMetadataHook).toHaveBeenCalled();

      const hook = awsRumInstance.setEventMetadataHook.mock.calls[0][0];
      expect(hook()).toEqual(attributes);
    });

    it('should be a no-op during server-side rendering', async () => {
      configure({ platformId: 'server' as unknown as object });
      await sink.init();

      expect(load).not.toHaveBeenCalled();
      expect(AwsRumCtor).not.toHaveBeenCalled();
    });

    it('should only initialize once', async () => {
      await sink.init();
      await sink.init();

      expect(AwsRumCtor).toHaveBeenCalledTimes(1);
    });

    it('should stay disabled when the broker declines', async () => {
      configure({ loadImpl: async () => null });
      await sink.init();

      expect(AwsRumCtor).not.toHaveBeenCalled();
    });

    it('should not throw when the broker rejects', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      configure({
        loadImpl: async () => {
          throw new Error('broker unreachable');
        }
      });

      await expect(sink.init()).resolves.toBeUndefined();
      // Normalized/redacted, like every other error this library reports —
      // never the raw caught value, which could carry credentials or PII
      // from a broker error body.
      expect(warn).toHaveBeenCalledWith(
        '[cps-telemetry] RUM init failed, monitoring disabled',
        expect.objectContaining({
          name: 'Error',
          message: 'broker unreachable'
        })
      );
    });

    it('should leave the application functional after a failed init', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      configure({
        loadImpl: async () => {
          throw new Error('broker unreachable');
        }
      });
      await sink.init();

      expect(() => sink.record('t', {})).not.toThrow();
      expect(() => sink.flush()).not.toThrow();
      expect(sink.getSessionId()).toBeUndefined();
    });

    it('should not construct the RUM client if destroyed while the first load is in flight', async () => {
      let resolveLoad!: (bootstrap: CpsRumBootstrap | null) => void;
      configure({
        loadImpl: () =>
          new Promise<CpsRumBootstrap | null>((resolve) => {
            resolveLoad = resolve;
          })
      });

      const initPromise = sink.init();
      sink.ngOnDestroy();
      resolveLoad(bootstrap());
      await initPromise;

      expect(AwsRumCtor).not.toHaveBeenCalled();
    });

    it('should work without credentials for an unauthenticated app monitor', async () => {
      configure({
        loadImpl: async () => ({ config: bootstrap().config })
      });
      await sink.init();

      expect(AwsRumCtor).toHaveBeenCalled();
      expect(awsRumInstance.setAwsCredentials).not.toHaveBeenCalled();
    });
  });

  describe('recording', () => {
    it('should forward events to the client once initialized', async () => {
      await sink.init();
      sink.record(CPS_TELEMETRY_EVENT_TYPE.bi, { eventName: 'clicked' });

      expect(awsRumInstance.recordEvent).toHaveBeenCalledWith(
        CPS_TELEMETRY_EVENT_TYPE.bi,
        { eventName: 'clicked' },
        undefined
      );
    });

    it('should buffer events recorded before init and replay them in order', async () => {
      sink.record('a', { n: 1 });
      sink.record('b', { n: 2 });

      expect(awsRumInstance.recordEvent).not.toHaveBeenCalled();

      await sink.init();

      expect(awsRumInstance.recordEvent).toHaveBeenCalledTimes(2);
      expect(awsRumInstance.recordEvent.mock.calls[0][0]).toBe('a');
      expect(awsRumInstance.recordEvent.mock.calls[1][0]).toBe('b');
    });

    it('should self-initialize and eventually deliver even if init() is never called directly', async () => {
      sink.record('a', { n: 1 });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(awsRumInstance.recordEvent).toHaveBeenCalledWith(
        'a',
        { n: 1 },
        undefined
      );
    });

    it('should drop the oldest buffered events beyond the limit', async () => {
      for (let i = 0; i < 150; i++) {
        sink.record('e', { i });
      }
      await sink.init();

      expect(awsRumInstance.recordEvent).toHaveBeenCalledTimes(100);
      expect(awsRumInstance.recordEvent.mock.calls[0][1]).toEqual({ i: 50 });
    });

    it('should not buffer during server-side rendering', async () => {
      configure({ platformId: 'server' as unknown as object });
      sink.record('a', {});
      await sink.init();

      expect(awsRumInstance.recordEvent).not.toHaveBeenCalled();
    });

    it('should drop metadata keys in the reserved aws: namespace', async () => {
      await sink.init();
      sink.record('a', {}, { 'aws:client': 'x', keep: 'yes', dropped: null });

      expect(awsRumInstance.recordEvent).toHaveBeenCalledWith(
        'a',
        {},
        {
          keep: 'yes'
        }
      );
    });

    it('should pass no metadata when nothing survives sanitization', async () => {
      await sink.init();
      sink.record('a', {}, { 'aws:client': 'x' });

      expect(awsRumInstance.recordEvent).toHaveBeenCalledWith(
        'a',
        {},
        undefined
      );
    });

    it('should forward handled errors to the client', async () => {
      await sink.init();
      sink.recordError({ name: 'TypeError', message: 'boom' });

      expect(awsRumInstance.recordError).toHaveBeenCalledWith({
        name: 'TypeError',
        message: 'boom'
      });
    });

    it('should fold a forwarded error origin into its name, since the SDK has no metadata channel for errors', async () => {
      await sink.init();
      sink.recordError(
        { name: 'TypeError', message: 'boom' },
        { application: 'fragment-app' }
      );

      expect(awsRumInstance.recordError).toHaveBeenCalledWith({
        name: '[fragment-app] TypeError',
        message: 'boom'
      });
    });

    it('should not modify the error when its origin matches this realm', async () => {
      await sink.init();
      sink.recordError(
        { name: 'TypeError', message: 'boom' },
        { application: 'test-app' }
      );

      expect(awsRumInstance.recordError).toHaveBeenCalledWith({
        name: 'TypeError',
        message: 'boom'
      });
    });

    it('should buffer an error recorded before init and replay it once ready', async () => {
      sink.recordError({ name: 'TypeError', message: 'boom' });

      expect(awsRumInstance.recordError).not.toHaveBeenCalled();

      await sink.init();

      expect(awsRumInstance.recordError).toHaveBeenCalledWith({
        name: 'TypeError',
        message: 'boom'
      });
    });

    it('should fold origin into a buffered error at replay time, same as an immediate one', async () => {
      sink.recordError(
        { name: 'TypeError', message: 'boom' },
        { application: 'fragment-app' }
      );

      await sink.init();

      expect(awsRumInstance.recordError).toHaveBeenCalledWith({
        name: '[fragment-app] TypeError',
        message: 'boom'
      });
    });

    it('should forward page views', async () => {
      await sink.init();
      sink.recordPageView('/customers');

      expect(awsRumInstance.recordPageView).toHaveBeenCalledWith('/customers');
    });

    it('should buffer a page view recorded before init and replay it, same as record()', async () => {
      sink.recordPageView('/customers');

      expect(awsRumInstance.recordPageView).not.toHaveBeenCalled();

      await sink.init();

      expect(awsRumInstance.recordPageView).toHaveBeenCalledWith('/customers');
    });

    it('should replay buffered events and page views in the order they were recorded', async () => {
      sink.record('a', { n: 1 });
      sink.recordPageView('/customers');
      sink.record('b', { n: 2 });

      await sink.init();

      expect(awsRumInstance.recordEvent.mock.calls[0][0]).toBe('a');
      expect(awsRumInstance.recordPageView).toHaveBeenCalledWith('/customers');
      expect(awsRumInstance.recordEvent.mock.calls[1][0]).toBe('b');
    });

    it('should not throw when the client throws', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await sink.init();
      awsRumInstance.recordEvent.mockImplementationOnce(() => {
        throw new Error('sdk exploded');
      });

      expect(() => sink.record('a', {})).not.toThrow();
      // Reported, not silently dropped — see cpsSafe's dev-mode reporting
      // contract, tested in cps-telemetry-safe.util.spec.ts.
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('rum.record failed'),
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('identity', () => {
    it('should pin a user id set after init', async () => {
      await sink.init();
      sink.setUserId('user-42');

      expect(awsRumInstance.pinUserId).toHaveBeenCalledWith('user-42');
    });

    it('should start a fresh anonymous session on sign-out', async () => {
      await sink.init();
      sink.setUserId('user-42');

      sink.setUserId(undefined);

      expect(awsRumInstance.startSession).toHaveBeenCalledWith({
        userId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      });
    });

    it('should not re-pin a signed-out user when the client starts later', async () => {
      sink.setUserId('user-42');
      sink.setUserId(undefined);

      await sink.init();

      expect(awsRumInstance.pinUserId).not.toHaveBeenCalled();
    });

    it('should pin a user id set before init once the client exists', async () => {
      sink.setUserId('user-42');
      expect(awsRumInstance.pinUserId).not.toHaveBeenCalled();

      await sink.init();

      expect(awsRumInstance.pinUserId).toHaveBeenCalledWith('user-42');
    });

    it('should report the client session id', async () => {
      await sink.init();
      expect(sink.getSessionId()).toBe('rum-session-1');
    });

    it('should report no session id before init', () => {
      expect(sink.getSessionId()).toBeUndefined();
    });
  });

  describe('flushing', () => {
    it('should dispatch normally by default', async () => {
      await sink.init();
      sink.flush();

      expect(awsRumInstance.dispatch).toHaveBeenCalled();
      expect(awsRumInstance.dispatchBeacon).not.toHaveBeenCalled();
    });

    it('should use a beacon when asked, so unload does not lose the batch', async () => {
      await sink.init();
      sink.flush(true);

      expect(awsRumInstance.dispatchBeacon).toHaveBeenCalled();
      expect(awsRumInstance.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('credential refresh', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should refresh shortly before the credentials expire', async () => {
      configure({ loadImpl: async () => bootstrap(undefined, 60 * 60 * 1000) });
      await sink.init();

      expect(load).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(55 * 60 * 1000);

      expect(load).toHaveBeenCalledTimes(2);
      expect(awsRumInstance.setAwsCredentials).toHaveBeenCalledTimes(2);
    });

    it('should retry after the bounded delay for already-expired credentials, instead of refreshing immediately', async () => {
      configure({ loadImpl: async () => bootstrap(undefined, -1000) });
      await sink.init();

      expect(load).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(0);
      expect(load).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(30 * 1000);
      expect(load).toHaveBeenCalledTimes(2);
    });

    it('should retry, not schedule a near-immediate refresh, for credentials expiring within the skew window', async () => {
      configure({ loadImpl: async () => bootstrap(undefined, 2 * 60 * 1000) });
      await sink.init();

      expect(load).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(0);
      expect(load).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(30 * 1000);
      expect(load).toHaveBeenCalledTimes(2);
    });

    it('should cap delay at 2^31-1 ms to prevent 32-bit integer overflow for far-future credentials', async () => {
      configure({
        loadImpl: async () => bootstrap(undefined, 100 * 24 * 60 * 60 * 1000)
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(1000);
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('should not throw when a refresh fails', async () => {
      let calls = 0;
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      configure({
        loadImpl: async () => {
          if (calls++ === 0) {
            return bootstrap(undefined, 6 * 60 * 1000);
          }
          throw new Error('broker down');
        }
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(60 * 1000);

      expect(warn).toHaveBeenCalledWith(
        '[cps-telemetry] RUM credential refresh failed',
        expect.objectContaining({ name: 'Error', message: 'broker down' })
      );
    });

    it('should cancel the pending refresh on destroy', async () => {
      configure({ loadImpl: async () => bootstrap(undefined, 60 * 60 * 1000) });
      await sink.init();

      sink.ngOnDestroy();
      await jest.advanceTimersByTimeAsync(60 * 60 * 1000);

      expect(load).toHaveBeenCalledTimes(1);
    });

    it('should retry a failed refresh instead of the chain dying permanently', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let calls = 0;
      configure({
        loadImpl: async () => {
          calls++;
          if (calls === 2) {
            throw new Error('transient broker blip');
          }
          return bootstrap(undefined, 6 * 60 * 1000);
        }
      });

      return sink.init().then(async () => {
        expect(calls).toBe(1);

        await jest.advanceTimersByTimeAsync(60 * 1000);
        expect(calls).toBe(2);
        expect(awsRumInstance.setAwsCredentials).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
          '[cps-telemetry] RUM credential refresh failed',
          expect.objectContaining({
            name: 'Error',
            message: 'transient broker blip'
          })
        );

        await jest.advanceTimersByTimeAsync(30 * 1000);
        expect(calls).toBe(3);
        expect(awsRumInstance.setAwsCredentials).toHaveBeenCalledTimes(2);

        warn.mockRestore();
      });
    });

    it('should not retry when a scheduled refresh comes back with credentials intentionally omitted', async () => {
      let calls = 0;
      configure({
        loadImpl: async () => {
          calls++;
          if (calls === 2) {
            return { config: bootstrap().config };
          }
          return bootstrap(undefined, 6 * 60 * 1000);
        }
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(calls).toBe(2);
      expect(awsRumInstance.setAwsCredentials).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(calls).toBe(2);
    });

    it('should disable RUM for the session when a scheduled refresh returns null, per the provider contract', async () => {
      let calls = 0;
      configure({
        loadImpl: async () => {
          calls++;
          if (calls === 2) {
            return null;
          }
          return bootstrap(undefined, 6 * 60 * 1000);
        }
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(calls).toBe(2);

      // No further refresh or retry should be scheduled once disabled.
      await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(calls).toBe(2);

      sink.record('a', {});
      expect(awsRumInstance.recordEvent).not.toHaveBeenCalled();
    });

    it('should drop, not buffer, events recorded after being disabled', async () => {
      let calls = 0;
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      configure({
        loadImpl: async () => {
          calls++;
          if (calls === 2) {
            return null;
          }
          return bootstrap(undefined, 6 * 60 * 1000);
        }
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(calls).toBe(2);

      sink.record('a', {});
      sink.record('b', {});
      sink.flush();

      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining('RUM event(s) lost')
      );
    });

    it('should not arm a new refresh timer if destroyed while a refresh is in flight', async () => {
      let resolveSecondLoad!: (bootstrap: CpsRumBootstrap) => void;
      let calls = 0;
      configure({
        loadImpl: () => {
          calls++;
          if (calls === 1) {
            return Promise.resolve(bootstrap(undefined, 6 * 60 * 1000));
          }
          return new Promise<CpsRumBootstrap>((resolve) => {
            resolveSecondLoad = resolve;
          });
        }
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(calls).toBe(2);

      sink.ngOnDestroy();

      resolveSecondLoad(bootstrap(undefined, 6 * 60 * 1000));
      await Promise.resolve();
      await Promise.resolve();

      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);
      expect(calls).toBe(2);
    });

    it('should not report a failure for a refresh that rejects after the sink was destroyed', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let rejectSecondLoad!: (error: Error) => void;
      let calls = 0;
      configure({
        loadImpl: () => {
          calls++;
          if (calls === 1) {
            return Promise.resolve(bootstrap(undefined, 6 * 60 * 1000));
          }
          return new Promise<CpsRumBootstrap>((_resolve, reject) => {
            rejectSecondLoad = reject;
          });
        }
      });
      await sink.init();

      await jest.advanceTimersByTimeAsync(60 * 1000);
      expect(calls).toBe(2);

      sink.ngOnDestroy();

      rejectSecondLoad(new Error('broker down'));
      await Promise.resolve();
      await Promise.resolve();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('flush before init resolves', () => {
    it('should warn in development and not throw when buffered events cannot be flushed', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let resolveLoad!: (bootstrap: CpsRumBootstrap | null) => void;
      configure({
        loadImpl: () =>
          new Promise<CpsRumBootstrap | null>((resolve) => {
            resolveLoad = resolve;
          })
      });

      const initPromise = sink.init();
      sink.record('com.cps.bi', { eventName: 'x' });

      expect(() => sink.flush(true)).not.toThrow();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('1 RUM event(s) lost')
      );

      resolveLoad(bootstrap());
      await initPromise;
    });

    it('should not warn when the buffer is empty', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let resolveLoad!: (bootstrap: CpsRumBootstrap | null) => void;
      configure({
        loadImpl: () =>
          new Promise<CpsRumBootstrap | null>((resolve) => {
            resolveLoad = resolve;
          })
      });

      const initPromise = sink.init();
      sink.flush(true);

      expect(warn).not.toHaveBeenCalled();

      resolveLoad(bootstrap());
      await initPromise;
    });
  });
});
