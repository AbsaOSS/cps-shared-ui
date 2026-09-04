import {
  CPS_TELEMETRY_EVENT_TYPE,
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import { CpsLogRecord } from '../../models/cps-log.models/cps-log.models';
import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CpsLoggerService } from '../../services/cps-logger.service/cps-logger.service';
import {
  CPS_DEFAULT_TELEMETRY_CONFIG,
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CPS_LOG_CONFIG } from '../../config/cps-log.config/cps-log.config';
import { CPS_SCENARIO_CONFIG } from '../../config/cps-scenario.config/cps-scenario.config';
import { CpsScenarioTelemetryService } from '../../services/cps-scenario-telemetry.service/cps-scenario-telemetry.service';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogApiProvider,
  CpsLogQuery
} from '../../providers/cps-log-api.provider/cps-log-api.provider';
import { CpsTelemetryBroadcastHost } from './cps-broadcast-host.service';
import { CpsBroadcastTelemetrySink } from './cps-broadcast-telemetry.sink';
import {
  CPS_BROADCAST_CHANNEL,
  CPS_DEFAULT_BROADCAST_CHANNEL,
  cpsConnectBroadcastChannel,
  cpsElectBroadcastHostLeader,
  cpsIsBroadcastMessage
} from './cps-broadcast.messages';
import { CpsTelemetrySink } from '../cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';

/**
 * Each realm gets its own injector — the shell and every fragment run in a
 * separate JavaScript context and share no Angular injector.
 */
function createRealm(providers: unknown[]): Injector {
  return Injector.create({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: DOCUMENT, useValue: document },
      {
        provide: CPS_TELEMETRY_IDENTITY,
        useValue: {
          application: 'realm',
          environment: 'test',
          version: '1.0.0'
        }
      },
      {
        provide: CPS_SCENARIO_CONFIG,
        useValue: {
          ...CPS_DEFAULT_TELEMETRY_CONFIG.scenario,
          defaultTimeoutMs: 0
        }
      },
      { provide: CPS_LOG_CONFIG, useValue: CPS_DEFAULT_TELEMETRY_CONFIG.logs },
      {
        provide: CPS_REDACT_CONFIG,
        useValue: CPS_DEFAULT_TELEMETRY_CONFIG.redact
      },
      RecordingLogApi,
      { provide: CPS_LOG_API_PROVIDER, useExisting: RecordingLogApi },
      CpsLoggerService,
      CpsScenarioTelemetryService,
      ...(providers as never[])
    ]
  });
}

/**
 * In-memory stand-in for `BroadcastChannel`, since jsdom implements none.
 *
 * Delivers messages between instances sharing a name to every other
 * instance, asynchronously, matching the real API.
 */
export class CpsBroadcastChannelStub {
  private static channels = new Map<string, CpsBroadcastChannelStub[]>();

  onmessage: ((event: { data: unknown }) => void) | null = null;

  closed = false;

  constructor(readonly name: string) {
    const peers = CpsBroadcastChannelStub.channels.get(name) ?? [];
    peers.push(this);
    CpsBroadcastChannelStub.channels.set(name, peers);
  }

  /** Installs the stub as the global `BroadcastChannel`. */
  static install(): void {
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      value: CpsBroadcastChannelStub,
      configurable: true,
      writable: true
    });
  }

  /**
   * Removes the global and forgets every channel.
   *
   * Closes every known channel first, so no delivery scheduled before
   * teardown reaches a listener from a previous test.
   */
  static uninstall(): void {
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;

    for (const peers of CpsBroadcastChannelStub.channels.values()) {
      peers.forEach((peer) => (peer.closed = true));
    }
    CpsBroadcastChannelStub.channels.clear();
  }

  /**
   * Runs pending deliveries until the channel is quiet.
   *
   * Several turns, since a request/response exchange takes a task in each
   * direction and a handler may post again.
   */
  static async settle(turns = 5): Promise<void> {
    for (let i = 0; i < turns; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  postMessage(message: unknown): void {
    if (this.closed) {
      return;
    }

    const peers = CpsBroadcastChannelStub.channels.get(this.name) ?? [];
    const data = JSON.parse(JSON.stringify(message));

    for (const peer of peers) {
      if (peer === this) {
        continue;
      }
      setTimeout(() => {
        if (!peer.closed) {
          peer.onmessage?.({ data });
        }
      }, 0);
    }
  }

  close(): void {
    this.closed = true;
    const peers = CpsBroadcastChannelStub.channels.get(this.name) ?? [];
    CpsBroadcastChannelStub.channels.set(
      this.name,
      peers.filter((peer) => peer !== this)
    );
  }
}

/** Minimal Web Locks API stub: grants each named lock to one requester at a time. */
class LockManagerStub {
  private readonly held = new Set<string>();
  private readonly queues = new Map<string, Array<() => void>>();

  request(name: string, callback: () => Promise<void>): Promise<void> {
    return new Promise((resolve) => {
      const grant = () => {
        this.held.add(name);
        callback().then(() => {
          this.held.delete(name);
          resolve();
          this.queues.get(name)?.shift()?.();
        });
      };

      if (this.held.has(name)) {
        const queue = this.queues.get(name) ?? [];
        queue.push(grant);
        this.queues.set(name, queue);
      } else {
        grant();
      }
    });
  }

  /** Installs the stub as `navigator.locks`. */
  static install(): void {
    Object.defineProperty(globalThis.navigator, 'locks', {
      value: new LockManagerStub(),
      configurable: true
    });
  }

  static uninstall(): void {
    delete (globalThis.navigator as { locks?: unknown }).locks;
  }
}

/** Captures what the library emitted, so a test can assert on it. */
@Injectable()
class RecordingSink extends CpsTelemetrySink {
  readonly events: {
    eventType: string;
    payload: Record<string, unknown>;
    metadata?: CpsTelemetryMetadata;
  }[] = [];

  readonly errors: CpsTelemetryError[] = [];
  readonly errorMetadata: (CpsTelemetryMetadata | undefined)[] = [];
  readonly flushes: boolean[] = [];
  userId?: string;
  sessionId: string | undefined = 'test-session';

  record(
    eventType: string,
    payload: object,
    metadata?: CpsTelemetryMetadata
  ): void {
    this.events.push({
      eventType,
      payload: payload as Record<string, unknown>,
      metadata
    });
  }

  recordError(error: CpsTelemetryError, metadata?: CpsTelemetryMetadata): void {
    this.errors.push(error);
    this.errorMetadata.push(metadata);
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  flush(beacon = false): void {
    this.flushes.push(beacon);
  }

  ofType(eventType: string) {
    return this.events.filter((event) => event.eventType === eventType);
  }
}

/** Keeps every batch, so a test can assert on what was shipped. */
@Injectable()
class RecordingLogApi implements CpsLogApiProvider {
  readonly records: CpsLogRecord[] = [];

  send(record: CpsLogRecord): void {
    this.records.push(record);
  }

  query(filter: CpsLogQuery): Promise<CpsLogRecord[]> {
    let found = this.records;
    if (filter.correlationId) {
      found = found.filter((r) => r.correlationId === filter.correlationId);
    }
    if (filter.logger) {
      found = found.filter((r) => r.logger === filter.logger);
    }
    if (filter.limit !== undefined) {
      found = found.slice(0, filter.limit);
    }
    return Promise.resolve(found);
  }
}

describe('broadcast telemetry across realms', () => {
  let shellSink: RecordingSink;
  let shell: Injector;
  let host: CpsTelemetryBroadcastHost;

  beforeEach(() => {
    CpsBroadcastChannelStub.install();
    TestBed.resetTestingModule();

    shell = createRealm([
      RecordingSink,
      { provide: CpsTelemetrySink, useExisting: RecordingSink },
      CpsTelemetryBroadcastHost
    ]);
    shellSink = shell.get(RecordingSink);
    host = shell.get(CpsTelemetryBroadcastHost);
  });

  afterEach(() => {
    host.ngOnDestroy();
    CpsBroadcastChannelStub.uninstall();
    jest.restoreAllMocks();
  });

  /** Builds a follower realm with a forwarding sink. */
  function createFragment(): Injector {
    const realm = createRealm([
      CpsBroadcastTelemetrySink,
      { provide: CpsTelemetrySink, useExisting: CpsBroadcastTelemetrySink }
    ]);
    // Resolve eagerly: Injector.create is lazy, and the sink's constructor
    // opens the channel and requests identity.
    realm.get(CpsTelemetrySink);
    return realm;
  }

  describe('forwarding', () => {
    it('should record a fragment event through the shell sink', async () => {
      const fragment = createFragment();
      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events).toEqual([
        expect.objectContaining({
          eventType: 'com.cps.bi',
          payload: { eventName: 'x' }
        })
      ]);
    });

    it('should attribute the event to the realm that emitted it', async () => {
      const fragment = createFragment();
      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events[0].metadata).toMatchObject({
        application: 'realm',
        environment: 'test',
        appVersion: '1.0.0'
      });
    });

    it('should carry event metadata', async () => {
      const fragment = createFragment();
      fragment
        .get(CpsTelemetrySink)
        .record('com.cps.bi', { eventName: 'x' }, { feature: 'cart' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events[0].metadata).toMatchObject({ feature: 'cart' });
    });

    it('should forward handled errors', async () => {
      const fragment = createFragment();
      fragment
        .get(CpsTelemetrySink)
        .recordError({ name: 'TypeError', message: 'boom' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.errors).toEqual([
        { name: 'TypeError', message: 'boom' }
      ]);
    });

    it('should attribute a forwarded error to the realm that recorded it', async () => {
      const fragment = createFragment();
      fragment
        .get(CpsTelemetrySink)
        .recordError({ name: 'TypeError', message: 'boom' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.errorMetadata[0]).toMatchObject({
        application: 'realm',
        environment: 'test',
        appVersion: '1.0.0'
      });
    });

    it('should forward flush requests, preserving the beacon flag', async () => {
      const fragment = createFragment();
      fragment.get(CpsTelemetrySink).flush(true);

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.flushes).toEqual([true]);
    });

    it('should forward a user id so one identity covers every realm', async () => {
      const fragment = createFragment();
      fragment.get(CpsTelemetrySink).setUserId('user-42');

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.userId).toBe('user-42');
    });

    it('should keep several fragments independent but pointed at one sink', async () => {
      const a = createFragment();
      const b = createFragment();

      a.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'from-a' });
      b.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'from-b' });

      await CpsBroadcastChannelStub.settle();

      expect(
        shellSink.events.map(
          (e) => (e.payload as { eventName: string }).eventName
        )
      ).toEqual(['from-a', 'from-b']);
    });

    it('should not create an AWS client in the fragment realm', () => {
      const fragment = createFragment();
      expect(fragment.get(CpsTelemetrySink)).toBeInstanceOf(
        CpsBroadcastTelemetrySink
      );
    });
  });

  describe('shared session identity', () => {
    it('should adopt the shell session id', async () => {
      shellSink.sessionId = 'shell-session-1';
      const fragment = createFragment();

      await CpsBroadcastChannelStub.settle();

      expect(fragment.get(CpsTelemetrySink).getSessionId()).toBe(
        'shell-session-1'
      );
    });

    it('should report no session id before the shell answers', () => {
      const fragment = createFragment();
      expect(fragment.get(CpsTelemetrySink).getSessionId()).toBeUndefined();
    });

    it('should reach a fragment that started before the shell host existed', async () => {
      host.ngOnDestroy();

      const fragment = createFragment();
      await CpsBroadcastChannelStub.settle();
      expect(fragment.get(CpsTelemetrySink).getSessionId()).toBeUndefined();

      const lateShell = createRealm([
        RecordingSink,
        { provide: CpsTelemetrySink, useExisting: RecordingSink },
        CpsTelemetryBroadcastHost
      ]);
      lateShell.get(RecordingSink).sessionId = 'late-session';
      host = lateShell.get(CpsTelemetryBroadcastHost);

      await CpsBroadcastChannelStub.settle();

      expect(fragment.get(CpsTelemetrySink).getSessionId()).toBe(
        'late-session'
      );
    });

    it('should re-announce once a session id that was not ready at construction resolves', async () => {
      shellSink.sessionId = undefined;
      const fragment = createFragment();
      await CpsBroadcastChannelStub.settle();
      expect(fragment.get(CpsTelemetrySink).getSessionId()).toBeUndefined();

      shellSink.sessionId = 'shell-session-1';

      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });
      await CpsBroadcastChannelStub.settle();

      expect(fragment.get(CpsTelemetrySink).getSessionId()).toBe(
        'shell-session-1'
      );
    });

    it('should propagate a user id set in one fragment to a sibling fragment', async () => {
      const a = createFragment();
      const b = createFragment();
      await CpsBroadcastChannelStub.settle();

      a.get(CpsTelemetrySink).setUserId('user-42');
      await CpsBroadcastChannelStub.settle();

      expect(b.get(CpsTelemetrySink).getUserId()).toBe('user-42');
    });

    it("should clear a sibling fragment's user id on sign-out", async () => {
      const a = createFragment();
      const b = createFragment();
      await CpsBroadcastChannelStub.settle();

      a.get(CpsTelemetrySink).setUserId('user-42');
      await CpsBroadcastChannelStub.settle();
      expect(b.get(CpsTelemetrySink).getUserId()).toBe('user-42');

      a.get(CpsTelemetrySink).setUserId(undefined);
      await CpsBroadcastChannelStub.settle();

      expect(b.get(CpsTelemetrySink).getUserId()).toBeUndefined();
    });

    it('should announce a user id set directly on the shell, not only one relayed from a fragment', async () => {
      const fragment = createFragment();
      await CpsBroadcastChannelStub.settle();

      shellSink.userId = 'shell-user';
      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });
      await CpsBroadcastChannelStub.settle();

      expect(fragment.get(CpsTelemetrySink).getUserId()).toBe('shell-user');
    });
  });

  describe('scenarios in a fragment', () => {
    it('should emit one packed record through the shell', async () => {
      const fragment = createFragment();
      const scenarioTelemetry = fragment.get(CpsScenarioTelemetryService);

      const scenario = scenarioTelemetry.start({ name: 'add-to-cart' });
      scenario.step('validate').step('submit');
      scenario.complete();

      await CpsBroadcastChannelStub.settle();

      const records = shellSink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario);
      expect(records).toHaveLength(1);
      expect(records[0].payload).toMatchObject({
        scenarioName: 'add-to-cart',
        status: 'success'
      });
    });

    it('should let a fragment scenario name a shell scenario as its parent', async () => {
      const fragment = createFragment();
      const scenarioTelemetry = fragment.get(CpsScenarioTelemetryService);

      scenarioTelemetry
        .start({ name: 'add-to-cart', parentScenarioId: 'shell-scenario-1' })
        .complete();

      await CpsBroadcastChannelStub.settle();

      expect(
        shellSink.ofType(CPS_TELEMETRY_EVENT_TYPE.scenario)[0].payload
      ).toMatchObject({ parentScenarioId: 'shell-scenario-1' });
    });
  });

  describe('robustness', () => {
    it('should ignore unrelated traffic on the channel', async () => {
      createFragment();
      const noise = new CpsBroadcastChannelStub('cps-telemetry');
      noise.postMessage({ some: 'other library' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
      expect(host.received).toBe(0);
    });

    it('should warn when a second host claims the same channel in this realm', () => {
      const channel = 'duplicate-detection-test';
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const providers = [
        RecordingSink,
        { provide: CpsTelemetrySink, useExisting: RecordingSink },
        { provide: CPS_BROADCAST_CHANNEL, useValue: channel }
      ];
      const first = createRealm([...providers, CpsTelemetryBroadcastHost]).get(
        CpsTelemetryBroadcastHost
      );

      expect(warn).not.toHaveBeenCalled();

      createRealm([...providers, CpsTelemetryBroadcastHost]).get(
        CpsTelemetryBroadcastHost
      );

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('a second telemetry host is active')
      );

      first.ngOnDestroy();
    });

    it('should not warn again for a fresh host once the only prior one on that channel was destroyed', () => {
      const channel = 'duplicate-detection-recreate-test';
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const providers = [
        RecordingSink,
        { provide: CpsTelemetrySink, useExisting: RecordingSink },
        { provide: CPS_BROADCAST_CHANNEL, useValue: channel }
      ];
      const first = createRealm([...providers, CpsTelemetryBroadcastHost]).get(
        CpsTelemetryBroadcastHost
      );
      first.ngOnDestroy();

      createRealm([...providers, CpsTelemetryBroadcastHost]).get(
        CpsTelemetryBroadcastHost
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should stop delivering once the fragment is destroyed', async () => {
      const fragment = createFragment();
      const sink = fragment.get(CpsBroadcastTelemetrySink);

      sink.ngOnDestroy();
      sink.record('com.cps.bi', { eventName: 'after-destroy' });

      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
    });

    it('should stop recording once the host is destroyed', async () => {
      const fragment = createFragment();
      host.ngOnDestroy();

      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });
      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
    });

    it('should use a separate channel when one is configured', async () => {
      const isolated = createRealm([
        CpsBroadcastTelemetrySink,
        { provide: CpsTelemetrySink, useExisting: CpsBroadcastTelemetrySink },
        { provide: CPS_BROADCAST_CHANNEL, useValue: 'other-network' }
      ]);

      isolated.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });
      await CpsBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
    });
  });

  describe('leader election', () => {
    let consoleWarn: jest.SpyInstance;
    let createdHosts: CpsTelemetryBroadcastHost[];

    beforeEach(() => {
      host.ngOnDestroy();
      LockManagerStub.install();
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      createdHosts = [];
    });

    afterEach(() => {
      createdHosts.forEach((h) => h.ngOnDestroy());
      LockManagerStub.uninstall();
      consoleWarn.mockRestore();
    });

    function createHost(): {
      host: CpsTelemetryBroadcastHost;
      sink: RecordingSink;
    } {
      const sink = new RecordingSink();
      const realmHost = createRealm([
        { provide: RecordingSink, useValue: sink },
        { provide: CpsTelemetrySink, useExisting: RecordingSink },
        CpsTelemetryBroadcastHost
      ]).get(CpsTelemetryBroadcastHost);
      createdHosts.push(realmHost);
      return { host: realmHost, sink };
    }

    it('should keep a second host passive while the first is still leader', async () => {
      const first = createHost();
      const second = createHost();

      const fragment = createFragment();
      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });
      await CpsBroadcastChannelStub.settle();

      expect(first.sink.events).toHaveLength(1);
      expect(second.sink.events).toHaveLength(0);
      expect(second.host.received).toBe(0);
    });

    it('should hand off leadership once the leader is destroyed', async () => {
      const first = createHost();
      const second = createHost();

      first.host.ngOnDestroy();
      await CpsBroadcastChannelStub.settle();

      const fragment = createFragment();
      fragment.get(CpsTelemetrySink).record('com.cps.bi', { eventName: 'x' });
      await CpsBroadcastChannelStub.settle();

      expect(second.sink.events).toHaveLength(1);
      expect(second.host.received).toBe(1);
    });
  });

  describe('cpsElectBroadcastHostLeader', () => {
    afterEach(() => LockManagerStub.uninstall());

    it('should elect immediately when the Locks API is unavailable', () => {
      const onElected = jest.fn();
      cpsElectBroadcastHostLeader('cps-telemetry', onElected);

      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should elect once the lock is granted', () => {
      LockManagerStub.install();
      const onElected = jest.fn();
      cpsElectBroadcastHostLeader('cps-telemetry', onElected);

      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should fail open and still elect when request() itself rejects', async () => {
      Object.defineProperty(globalThis.navigator, 'locks', {
        value: { request: () => Promise.reject(new Error('not-fully-active')) },
        configurable: true
      });
      const onElected = jest.fn();

      cpsElectBroadcastHostLeader('cps-telemetry', onElected);
      // Let the rejection's microtask settle.
      await Promise.resolve();
      await Promise.resolve();

      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should fail open and still elect when request() itself throws synchronously', () => {
      Object.defineProperty(globalThis.navigator, 'locks', {
        value: {
          request: () => {
            throw new Error('locks unavailable in this context');
          }
        },
        configurable: true
      });
      const onElected = jest.fn();

      expect(() =>
        cpsElectBroadcastHostLeader('cps-telemetry', onElected)
      ).not.toThrow();
      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should not elect a requester released while still queued, and should let the next requester through', async () => {
      LockManagerStub.install();
      const onElectedHolder = jest.fn();
      const onElectedA = jest.fn();
      const onElectedB = jest.fn();

      const releaseHolder = cpsElectBroadcastHostLeader(
        'cps-telemetry',
        onElectedHolder
      );
      const releaseA = cpsElectBroadcastHostLeader('cps-telemetry', onElectedA);
      cpsElectBroadcastHostLeader('cps-telemetry', onElectedB);

      // A is released before ever being granted the lock.
      releaseA();
      // The current holder releases, so the lock passes down the queue.
      releaseHolder();
      for (let i = 0; i < 6; i++) {
        await Promise.resolve();
      }

      expect(onElectedA).not.toHaveBeenCalled();
      expect(onElectedB).toHaveBeenCalledTimes(1);
    });
  });

  describe('cpsIsBroadcastMessage', () => {
    it.each([null, undefined, 'string', 42, ['array']])(
      'should reject the non-object payload %p',
      (data) => {
        expect(cpsIsBroadcastMessage(data)).toBe(false);
      }
    );

    it('should reject a payload with an unknown kind', () => {
      expect(cpsIsBroadcastMessage({ kind: 'other library' })).toBe(false);
    });

    it('should accept a well-formed event message', () => {
      expect(
        cpsIsBroadcastMessage({
          kind: 'event',
          eventType: 'com.cps.bi',
          payload: { eventName: 'x' }
        })
      ).toBe(true);
    });

    it.each([
      { eventType: 'com.cps.bi' },
      { payload: {} },
      { eventType: 1, payload: {} },
      { eventType: 'com.cps.bi', payload: 'not-an-object' }
    ])('should reject a malformed event message %p', (fields) => {
      expect(cpsIsBroadcastMessage({ kind: 'event', ...fields })).toBe(false);
    });

    it('should accept a well-formed error message', () => {
      expect(
        cpsIsBroadcastMessage({
          kind: 'error',
          error: { name: 'Error', message: 'boom' }
        })
      ).toBe(true);
    });

    it.each([
      {},
      { error: { name: 'Error' } },
      { error: { message: 'boom' } },
      { error: 'boom' },
      { error: { name: 'Error', message: 'boom', stack: 42 } }
    ])('should reject a malformed error message %p', (fields) => {
      expect(cpsIsBroadcastMessage({ kind: 'error', ...fields })).toBe(false);
    });

    it('should accept an error message with a string stack', () => {
      expect(
        cpsIsBroadcastMessage({
          kind: 'error',
          error: { name: 'Error', message: 'boom', stack: 'at foo.ts:1' }
        })
      ).toBe(true);
    });

    it('should accept a well-formed flush message', () => {
      expect(cpsIsBroadcastMessage({ kind: 'flush', beacon: true })).toBe(true);
    });

    it('should reject a flush message with a non-boolean beacon', () => {
      expect(cpsIsBroadcastMessage({ kind: 'flush', beacon: 'true' })).toBe(
        false
      );
    });

    it.each([{ userId: 'u-1' }, { userId: undefined }, {}])(
      'should accept a well-formed user message %p',
      (fields) => {
        expect(cpsIsBroadcastMessage({ kind: 'user', ...fields })).toBe(true);
      }
    );

    it('should reject a user message with a non-string, non-undefined userId', () => {
      expect(cpsIsBroadcastMessage({ kind: 'user', userId: 42 })).toBe(false);
    });

    it('should accept an identity-request message with no other fields', () => {
      expect(cpsIsBroadcastMessage({ kind: 'identity-request' })).toBe(true);
    });

    it.each([
      {},
      { sessionId: 's-1' },
      { userId: 'u-1' },
      {
        sessionId: 's-1',
        userId: 'u-1'
      }
    ])('should accept an identity message %p', (fields) => {
      expect(cpsIsBroadcastMessage({ kind: 'identity', ...fields })).toBe(true);
    });

    it.each([{ sessionId: 42 }, { userId: 42 }, { sessionId: 42, userId: 42 }])(
      'should reject an identity message with a non-string, non-undefined field %p',
      (fields) => {
        expect(cpsIsBroadcastMessage({ kind: 'identity', ...fields })).toBe(
          false
        );
      }
    );
  });

  describe('cpsConnectBroadcastChannel', () => {
    it('should default the channel name to CPS_DEFAULT_BROADCAST_CHANNEL', () => {
      const connection = TestBed.runInInjectionContext(() =>
        cpsConnectBroadcastChannel('test')
      );
      expect(connection.channelName).toBe(CPS_DEFAULT_BROADCAST_CHANNEL);
    });

    it('should read an overridden channel name from CPS_BROADCAST_CHANNEL', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: CPS_BROADCAST_CHANNEL, useValue: 'my-channel' }]
      });
      const connection = TestBed.runInInjectionContext(() =>
        cpsConnectBroadcastChannel('test')
      );
      expect(connection.channelName).toBe('my-channel');
    });

    it('should invoke the registered handler for an incoming message', async () => {
      const connection = TestBed.runInInjectionContext(() =>
        cpsConnectBroadcastChannel('test')
      );
      const received: unknown[] = [];
      connection.onMessage((data) => received.push(data));

      const peer = new CpsBroadcastChannelStub(CPS_DEFAULT_BROADCAST_CHANNEL);
      peer.postMessage({ kind: 'flush', beacon: true });
      await CpsBroadcastChannelStub.settle();

      expect(received).toEqual([{ kind: 'flush', beacon: true }]);
    });

    it('should stop delivering to a closed connection', async () => {
      const connection = TestBed.runInInjectionContext(() =>
        cpsConnectBroadcastChannel('test')
      );
      const received: unknown[] = [];
      connection.onMessage((data) => received.push(data));
      connection.close();

      const peer = new CpsBroadcastChannelStub(CPS_DEFAULT_BROADCAST_CHANNEL);
      peer.postMessage({ kind: 'flush', beacon: true });
      await CpsBroadcastChannelStub.settle();

      expect(received).toEqual([]);
    });

    it('should degrade to a safe no-op when BroadcastChannel is unavailable', () => {
      CpsBroadcastChannelStub.uninstall();
      const connection = TestBed.runInInjectionContext(() =>
        cpsConnectBroadcastChannel('test')
      );

      expect(() => {
        connection.post({ kind: 'identity-request' });
        connection.onMessage(() => undefined);
        connection.close();
      }).not.toThrow();
    });
  });

  describe('without BroadcastChannel support', () => {
    beforeEach(() => CpsBroadcastChannelStub.uninstall());

    it('should degrade to a no-op sink rather than throwing', () => {
      const fragment = createFragment();
      const sink = fragment.get(CpsTelemetrySink);

      expect(() => {
        sink.record('com.cps.bi', { eventName: 'x' });
        sink.recordError({ name: 'Error', message: 'boom' });
        sink.setUserId('user-1');
        sink.flush(true);
      }).not.toThrow();
      expect(sink.getSessionId()).toBeUndefined();
    });

    it('should let a scenario run to completion in the fragment', () => {
      const fragment = createFragment();
      const scenarioTelemetry = fragment.get(CpsScenarioTelemetryService);

      const scenario = scenarioTelemetry.start({ name: 'add-to-cart' });
      expect(() => scenario.step('one').complete()).not.toThrow();
      expect(scenario.status).toBe('success');
    });
  });
});
