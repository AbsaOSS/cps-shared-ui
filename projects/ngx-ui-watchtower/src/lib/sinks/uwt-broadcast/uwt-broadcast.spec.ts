import {
  UWT_TELEMETRY_EVENT_TYPE,
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { UwtLogRecord } from '../../models/uwt-log.models/uwt-log.models';
import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UwtLoggerService } from '../../services/uwt-logger.service/uwt-logger.service';
import {
  UWT_DEFAULT_TELEMETRY_CONFIG,
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY
} from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { UWT_LOG_CONFIG } from '../../config/uwt-log.config/uwt-log.config';
import { UWT_SCENARIO_TELEMETRY_CONFIG } from '../../config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
import { UwtScenarioTelemetryService } from '../../services/uwt-scenario-telemetry.service/uwt-scenario-telemetry.service';
import {
  UWT_LOG_API_PROVIDER,
  UwtLogApiProvider,
  UwtLogQuery
} from '../../providers/uwt-log-api.provider/uwt-log-api.provider';
import { UwtTelemetryBroadcastHost } from './uwt-broadcast-host.service';
import { UwtBroadcastTelemetrySink } from './uwt-broadcast-telemetry.sink';
import {
  UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS,
  UwtBroadcastLogApiProvider
} from '../../providers/uwt-broadcast-log-api.provider/uwt-broadcast-log-api.provider';
import {
  UWT_BROADCAST_CHANNEL,
  UWT_DEFAULT_BROADCAST_CHANNEL,
  uwtConnectBroadcastChannel,
  uwtElectBroadcastHostLeader,
  uwtIsBroadcastMessage
} from './uwt-broadcast.messages';
import { UwtTelemetrySink } from '../uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import { UwtTelemetryMonitor } from '../../services/uwt-telemetry-monitor.service/uwt-telemetry-monitor.service';
import { UwtTelemetryObservedEvent } from '../../models/uwt-telemetry-monitor.models/uwt-telemetry-monitor.models';

/**
 * Each realm gets its own injector — the shell and every fragment run in a
 * separate JavaScript context and share no Angular injector.
 */
function createRealm(providers: unknown[]): Injector {
  return Injector.create({
    providers: [
      UwtTelemetryMonitor,
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: DOCUMENT, useValue: document },
      {
        provide: UWT_TELEMETRY_IDENTITY,
        useValue: {
          application: 'realm',
          environment: 'test',
          version: '1.0.0'
        }
      },
      {
        provide: UWT_SCENARIO_TELEMETRY_CONFIG,
        useValue: {
          ...UWT_DEFAULT_TELEMETRY_CONFIG.scenario,
          defaultTimeoutMs: 0
        }
      },
      { provide: UWT_LOG_CONFIG, useValue: UWT_DEFAULT_TELEMETRY_CONFIG.logs },
      {
        provide: UWT_REDACT_CONFIG,
        useValue: UWT_DEFAULT_TELEMETRY_CONFIG.redact
      },
      RecordingLogApi,
      { provide: UWT_LOG_API_PROVIDER, useExisting: RecordingLogApi },
      UwtLoggerService,
      UwtScenarioTelemetryService,
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
export class UwtBroadcastChannelStub {
  private static channels = new Map<string, UwtBroadcastChannelStub[]>();

  onmessage: ((event: { data: unknown }) => void) | null = null;

  closed = false;

  constructor(readonly name: string) {
    const peers = UwtBroadcastChannelStub.channels.get(name) ?? [];
    peers.push(this);
    UwtBroadcastChannelStub.channels.set(name, peers);
  }

  /** Installs the stub as the global `BroadcastChannel`. */
  static install(): void {
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      value: UwtBroadcastChannelStub,
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

    for (const peers of UwtBroadcastChannelStub.channels.values()) {
      peers.forEach((peer) => (peer.closed = true));
    }
    UwtBroadcastChannelStub.channels.clear();
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

    const peers = UwtBroadcastChannelStub.channels.get(this.name) ?? [];
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
    const peers = UwtBroadcastChannelStub.channels.get(this.name) ?? [];
    UwtBroadcastChannelStub.channels.set(
      this.name,
      peers.filter((peer) => peer !== this)
    );
  }
}

/** Minimal Web Locks API stub: grants each named lock to one requester at a time. */
class LockManagerStub {
  private readonly held = new Set<string>();
  private readonly queues = new Map<string, (() => void)[]>();

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
class RecordingSink extends UwtTelemetrySink {
  readonly events: {
    eventType: string;
    payload: Record<string, unknown>;
    metadata?: UwtTelemetryMetadata;
  }[] = [];

  readonly errors: UwtTelemetryError[] = [];
  readonly errorMetadata: (UwtTelemetryMetadata | undefined)[] = [];
  readonly flushes: boolean[] = [];
  userId?: string;
  sessionId: string | undefined = 'test-session';

  record(
    eventType: string,
    payload: object,
    metadata?: UwtTelemetryMetadata
  ): void {
    this.events.push({
      eventType,
      payload: payload as Record<string, unknown>,
      metadata
    });
  }

  recordError(error: UwtTelemetryError, metadata?: UwtTelemetryMetadata): void {
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
class RecordingLogApi implements UwtLogApiProvider {
  readonly records: UwtLogRecord[] = [];
  flushes = 0;

  flush(): void {
    this.flushes++;
  }

  send(record: UwtLogRecord): void {
    this.records.push(record);
  }

  query(filter: UwtLogQuery): Promise<UwtLogRecord[]> {
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
  let host: UwtTelemetryBroadcastHost;

  beforeEach(() => {
    UwtBroadcastChannelStub.install();
    TestBed.resetTestingModule();

    shell = createRealm([
      RecordingSink,
      { provide: UwtTelemetrySink, useExisting: RecordingSink },
      UwtTelemetryBroadcastHost
    ]);
    shellSink = shell.get(RecordingSink);
    host = shell.get(UwtTelemetryBroadcastHost);
  });

  afterEach(() => {
    host.ngOnDestroy();
    UwtBroadcastChannelStub.uninstall();
    jest.restoreAllMocks();
  });

  /**
   * Builds a follower realm wired as `provideUwtTelemetrySink('broadcast')`
   * wires one: a forwarding sink and a forwarding log provider.
   */
  function createFragment(): Injector {
    const realm = createRealm([
      UwtBroadcastTelemetrySink,
      { provide: UwtTelemetrySink, useExisting: UwtBroadcastTelemetrySink },
      UwtBroadcastLogApiProvider,
      { provide: UWT_LOG_API_PROVIDER, useExisting: UwtBroadcastLogApiProvider }
    ]);
    // Resolve eagerly: Injector.create is lazy, and the sink's constructor
    // opens the channel and requests identity.
    realm.get(UwtTelemetrySink);
    realm.get(UWT_LOG_API_PROVIDER);
    return realm;
  }

  /** A record as a log backend would hand it back. */
  function storedRecord(fields: Partial<UwtLogRecord> = {}): UwtLogRecord {
    return {
      timestamp: '2026-01-01T00:00:00.000Z',
      level: 'log',
      message: 'stored',
      application: 'realm',
      environment: 'test',
      version: '1.0.0',
      ...fields
    };
  }

  describe('forwarding', () => {
    it('should record a fragment event through the shell sink', async () => {
      const fragment = createFragment();
      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events).toEqual([
        expect.objectContaining({
          eventType: 'com.uwt.bi',
          payload: { eventName: 'x' }
        })
      ]);
    });

    it('should attribute the event to the realm that emitted it', async () => {
      const fragment = createFragment();
      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events[0].metadata).toMatchObject({
        application: 'realm',
        environment: 'test',
        appVersion: '1.0.0'
      });
    });

    it('should carry event metadata', async () => {
      const fragment = createFragment();
      fragment
        .get(UwtTelemetrySink)
        .record('com.uwt.bi', { eventName: 'x' }, { feature: 'cart' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events[0].metadata).toMatchObject({ feature: 'cart' });
    });

    it('should show a forwarded event to the shell monitor, marked with its realm', async () => {
      const observed: UwtTelemetryObservedEvent[] = [];
      shell.get(UwtTelemetryMonitor).events$.subscribe((e) => observed.push(e));
      const fragment = createFragment();

      fragment
        .get(UwtTelemetrySink)
        .record('com.uwt.scenario.step', { scenarioName: 'load' });
      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      fragment.get(UwtTelemetrySink).record('custom.type', { a: 1 });
      fragment
        .get(UwtTelemetrySink)
        .recordError({ name: 'TypeError', message: 'boom' });
      await UwtBroadcastChannelStub.settle();

      expect(observed.map((e) => e.kind)).toEqual([
        'scenario-step',
        'bi',
        'unknown',
        'error'
      ]);
      for (const e of observed) {
        expect(e.origin).toEqual({ forwarded: true, application: 'realm' });
        expect(e.destination).toBe('sink');
      }
      expect(shellSink.events).toHaveLength(3);
      expect(shellSink.errors).toHaveLength(1);
    });

    it('should show a fragment scenario once per monitor — local in the fragment, forwarded in the shell', async () => {
      const fragment = createFragment();
      const inShell: UwtTelemetryObservedEvent[] = [];
      const inFragment: UwtTelemetryObservedEvent[] = [];
      shell.get(UwtTelemetryMonitor).events$.subscribe((e) => inShell.push(e));
      fragment
        .get(UwtTelemetryMonitor)
        .events$.subscribe((e) => inFragment.push(e));

      fragment
        .get(UwtScenarioTelemetryService)
        .start({ name: 'load' })
        .complete();
      await UwtBroadcastChannelStub.settle();

      expect(fragment.get(UwtTelemetryMonitor)).not.toBe(
        shell.get(UwtTelemetryMonitor)
      );
      expect(inFragment).toHaveLength(1);
      expect(inFragment[0]).toMatchObject({
        kind: 'scenario',
        origin: { forwarded: false }
      });
      expect(inShell).toHaveLength(1);
      expect(inShell[0]).toMatchObject({
        kind: 'scenario',
        origin: { forwarded: true, application: 'realm' }
      });

      expect(
        shellSink.events.filter((e) => e.eventType === 'com.uwt.scenario')
      ).toHaveLength(1);
    });

    it('should forward handled errors', async () => {
      const fragment = createFragment();
      fragment
        .get(UwtTelemetrySink)
        .recordError({ name: 'TypeError', message: 'boom' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.errors).toEqual([
        { name: 'TypeError', message: 'boom' }
      ]);
    });

    it('should attribute a forwarded error to the realm that recorded it', async () => {
      const fragment = createFragment();
      fragment
        .get(UwtTelemetrySink)
        .recordError({ name: 'TypeError', message: 'boom' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.errorMetadata[0]).toMatchObject({
        application: 'realm',
        environment: 'test',
        appVersion: '1.0.0'
      });
    });

    it('should forward flush requests, preserving the beacon flag', async () => {
      const fragment = createFragment();
      fragment.get(UwtTelemetrySink).flush(true);

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.flushes).toEqual([true]);
    });

    it('should forward a user id so one identity covers every realm', async () => {
      const fragment = createFragment();
      fragment.get(UwtTelemetrySink).setUserId('user-42');

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.userId).toBe('user-42');
    });

    it('should keep several fragments independent but pointed at one sink', async () => {
      const a = createFragment();
      const b = createFragment();

      a.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'from-a' });
      b.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'from-b' });

      await UwtBroadcastChannelStub.settle();

      expect(
        shellSink.events.map(
          (e) => (e.payload as { eventName: string }).eventName
        )
      ).toEqual(['from-a', 'from-b']);
    });

    it('should not create an AWS client in the fragment realm', () => {
      const fragment = createFragment();
      expect(fragment.get(UwtTelemetrySink)).toBeInstanceOf(
        UwtBroadcastTelemetrySink
      );
    });
  });

  describe('shared session identity', () => {
    it('should adopt the shell session id', async () => {
      shellSink.sessionId = 'shell-session-1';
      const fragment = createFragment();

      await UwtBroadcastChannelStub.settle();

      expect(fragment.get(UwtTelemetrySink).getSessionId()).toBe(
        'shell-session-1'
      );
    });

    it('should report no session id before the shell answers', () => {
      const fragment = createFragment();
      expect(fragment.get(UwtTelemetrySink).getSessionId()).toBeUndefined();
    });

    it('should reach a fragment that started before the shell host existed', async () => {
      host.ngOnDestroy();

      const fragment = createFragment();
      await UwtBroadcastChannelStub.settle();
      expect(fragment.get(UwtTelemetrySink).getSessionId()).toBeUndefined();

      const lateShell = createRealm([
        RecordingSink,
        { provide: UwtTelemetrySink, useExisting: RecordingSink },
        UwtTelemetryBroadcastHost
      ]);
      lateShell.get(RecordingSink).sessionId = 'late-session';
      host = lateShell.get(UwtTelemetryBroadcastHost);

      await UwtBroadcastChannelStub.settle();

      expect(fragment.get(UwtTelemetrySink).getSessionId()).toBe(
        'late-session'
      );
    });

    it('should re-announce once a session id that was not ready at construction resolves', async () => {
      shellSink.sessionId = undefined;
      const fragment = createFragment();
      await UwtBroadcastChannelStub.settle();
      expect(fragment.get(UwtTelemetrySink).getSessionId()).toBeUndefined();

      shellSink.sessionId = 'shell-session-1';

      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      await UwtBroadcastChannelStub.settle();

      expect(fragment.get(UwtTelemetrySink).getSessionId()).toBe(
        'shell-session-1'
      );
    });

    it('should propagate a user id set in one fragment to a sibling fragment', async () => {
      const a = createFragment();
      const b = createFragment();
      await UwtBroadcastChannelStub.settle();

      a.get(UwtTelemetrySink).setUserId('user-42');
      await UwtBroadcastChannelStub.settle();

      expect(b.get(UwtTelemetrySink).getUserId()).toBe('user-42');
    });

    it("should clear a sibling fragment's user id on sign-out", async () => {
      const a = createFragment();
      const b = createFragment();
      await UwtBroadcastChannelStub.settle();

      a.get(UwtTelemetrySink).setUserId('user-42');
      await UwtBroadcastChannelStub.settle();
      expect(b.get(UwtTelemetrySink).getUserId()).toBe('user-42');

      a.get(UwtTelemetrySink).setUserId(undefined);
      await UwtBroadcastChannelStub.settle();

      expect(b.get(UwtTelemetrySink).getUserId()).toBeUndefined();
    });

    it("should sign out every realm when a fragment sets ''", async () => {
      const a = createFragment();
      const b = createFragment();
      await UwtBroadcastChannelStub.settle();

      a.get(UwtTelemetrySink).setUserId('user-42');
      await UwtBroadcastChannelStub.settle();

      a.get(UwtTelemetrySink).setUserId('');
      await UwtBroadcastChannelStub.settle();

      expect(shellSink.userId).toBe('');
      expect(b.get(UwtTelemetrySink).getUserId()).toBe('');
    });

    it('should announce a user id set directly on the shell, not only one relayed from a fragment', async () => {
      const fragment = createFragment();
      await UwtBroadcastChannelStub.settle();

      shellSink.userId = 'shell-user';
      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      await UwtBroadcastChannelStub.settle();

      expect(fragment.get(UwtTelemetrySink).getUserId()).toBe('shell-user');
    });
  });

  describe('scenarios in a fragment', () => {
    it('should emit one packed record through the shell', async () => {
      const fragment = createFragment();
      const scenarioTelemetry = fragment.get(UwtScenarioTelemetryService);

      const scenario = scenarioTelemetry.start({ name: 'add-to-cart' });
      scenario.step('validate').step('submit');
      scenario.complete();

      await UwtBroadcastChannelStub.settle();

      const records = shellSink.ofType(UWT_TELEMETRY_EVENT_TYPE.scenario);
      expect(records).toHaveLength(1);
      expect(records[0].payload).toMatchObject({
        scenarioName: 'add-to-cart',
        status: 'success'
      });
    });

    it('should let a fragment scenario name a shell scenario as its parent', async () => {
      const fragment = createFragment();
      const scenarioTelemetry = fragment.get(UwtScenarioTelemetryService);

      scenarioTelemetry
        .start({ name: 'add-to-cart', parentScenarioId: 'shell-scenario-1' })
        .complete();

      await UwtBroadcastChannelStub.settle();

      expect(
        shellSink.ofType(UWT_TELEMETRY_EVENT_TYPE.scenario)[0].payload
      ).toMatchObject({
        parentScenarioId: 'shell-scenario-1'
      });
    });
  });

  describe('logs from a fragment', () => {
    it('should ship a fragment log record through the shell log provider, and only there', async () => {
      const fragment = createFragment();
      fragment
        .get(UwtLoggerService)
        .getLogger('cart')
        .warn('Careful now', { correlationId: 'c-1' });

      await UwtBroadcastChannelStub.settle();

      expect(shell.get(RecordingLogApi).records).toEqual([
        expect.objectContaining({
          level: 'warn',
          message: 'Careful now',
          logger: 'cart',
          correlationId: 'c-1',
          application: 'realm'
        })
      ]);
      // The fragment's realm has a backend bound too; it must stay unused.
      expect(fragment.get(RecordingLogApi).records).toHaveLength(0);
    });

    it('should show a forwarded record once per monitor — local in the fragment, forwarded in the shell', async () => {
      const fragment = createFragment();
      const inShell: UwtTelemetryObservedEvent[] = [];
      const inFragment: UwtTelemetryObservedEvent[] = [];
      shell.get(UwtTelemetryMonitor).events$.subscribe((e) => inShell.push(e));
      fragment
        .get(UwtTelemetryMonitor)
        .events$.subscribe((e) => inFragment.push(e));

      fragment.get(UwtLoggerService).getLogger('cart').log('Hello');
      await UwtBroadcastChannelStub.settle();

      expect(inFragment).toEqual([
        expect.objectContaining({
          kind: 'log',
          destination: 'log-provider',
          origin: { forwarded: false }
        })
      ]);
      expect(inShell).toEqual([
        expect.objectContaining({
          kind: 'log',
          destination: 'log-provider',
          origin: { forwarded: true, application: 'realm' },
          payload: expect.objectContaining({ message: 'Hello' })
        })
      ]);
    });

    it('should forward a flush to the shell log provider', async () => {
      const fragment = createFragment();
      fragment.get(UWT_LOG_API_PROVIDER).flush?.();

      await UwtBroadcastChannelStub.settle();

      expect(shell.get(RecordingLogApi).flushes).toBe(1);
    });

    it('should answer a fragment query from the shell log provider', async () => {
      const shellLogs = shell.get(RecordingLogApi);
      shellLogs.send(storedRecord({ correlationId: 'c-9', message: 'mine' }));
      shellLogs.send(storedRecord({ correlationId: 'c-other' }));
      const fragment = createFragment();

      const pending = fragment
        .get(UwtLoggerService)
        .query({ correlationId: 'c-9' });
      await UwtBroadcastChannelStub.settle();

      await expect(pending).resolves.toEqual([
        expect.objectContaining({ correlationId: 'c-9', message: 'mine' })
      ]);
    });

    it('should resolve a query to [] when the shell provider rejects', async () => {
      jest
        .spyOn(shell.get(RecordingLogApi), 'query')
        .mockRejectedValue(new Error('backend down'));
      const fragment = createFragment();

      const pending = fragment.get(UwtLoggerService).query({});
      await UwtBroadcastChannelStub.settle();

      await expect(pending).resolves.toEqual([]);
    });

    it('should keep only well-formed records from the answer', async () => {
      jest
        .spyOn(shell.get(RecordingLogApi), 'query')
        .mockResolvedValue([
          storedRecord({ message: 'good' }),
          { junk: true } as unknown as UwtLogRecord
        ]);
      const fragment = createFragment();

      const pending = fragment.get(UwtLoggerService).query({});
      await UwtBroadcastChannelStub.settle();

      await expect(pending).resolves.toEqual([
        expect.objectContaining({ message: 'good' })
      ]);
    });

    it('should resolve a query to [] once no host has answered in time', async () => {
      jest.useFakeTimers();
      try {
        host.ngOnDestroy();
        const fragment = createFragment();
        let result: UwtLogRecord[] | undefined;
        fragment
          .get(UwtLoggerService)
          .query({})
          .then((records) => (result = records));

        await jest.advanceTimersByTimeAsync(
          UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS - 1
        );
        expect(result).toBeUndefined();

        await jest.advanceTimersByTimeAsync(1);
        expect(result).toEqual([]);
      } finally {
        jest.useRealTimers();
      }
    });

    it('should resolve unanswered queries to [] when the provider is destroyed', async () => {
      host.ngOnDestroy();
      const provider = createFragment().get(UwtBroadcastLogApiProvider);

      const pending = provider.query({});
      provider.ngOnDestroy();

      await expect(pending).resolves.toEqual([]);
    });

    it('should fail at injection when the shell binds no log provider', () => {
      const bareShell = Injector.create({
        providers: [
          UwtTelemetryMonitor,
          { provide: PLATFORM_ID, useValue: 'browser' },
          RecordingSink,
          { provide: UwtTelemetrySink, useExisting: RecordingSink },
          UwtTelemetryBroadcastHost
        ]
      });

      expect(() => bareShell.get(UwtTelemetryBroadcastHost)).toThrow(
        /UWT_LOG_API_PROVIDER/
      );
    });

    it('should link a mirrored error to its forwarded log record in the shell monitor', async () => {
      const fragment = createRealm([
        UwtBroadcastTelemetrySink,
        { provide: UwtTelemetrySink, useExisting: UwtBroadcastTelemetrySink },
        UwtBroadcastLogApiProvider,
        {
          provide: UWT_LOG_API_PROVIDER,
          useExisting: UwtBroadcastLogApiProvider
        },
        {
          provide: UWT_LOG_CONFIG,
          useValue: {
            ...UWT_DEFAULT_TELEMETRY_CONFIG.logs,
            mirrorErrorsToRum: true
          }
        }
      ]);
      const inShell: UwtTelemetryObservedEvent[] = [];
      shell.get(UwtTelemetryMonitor).events$.subscribe((e) => inShell.push(e));

      const logger = fragment.get(UwtLoggerService).getLogger('cart');
      logger.error('Payment failed');
      logger.error('Card declined', { error: new TypeError('declined') });
      await UwtBroadcastChannelStub.settle();

      expect(inShell.map((e) => e.kind)).toEqual([
        'log',
        'error',
        'log',
        'error'
      ]);
      const [firstLog, firstMirror, secondLog, secondMirror] = inShell;
      expect(firstMirror).toMatchObject({
        payload: { name: 'Error', message: 'Payment failed' },
        relatedSequence: firstLog.sequence
      });
      expect(secondMirror).toMatchObject({
        payload: { name: 'TypeError', message: 'declined' },
        relatedSequence: secondLog.sequence
      });
    });

    it('should not link an error that is not the mirror of the record before it', async () => {
      const fragment = createFragment();
      const inShell: UwtTelemetryObservedEvent[] = [];
      shell.get(UwtTelemetryMonitor).events$.subscribe((e) => inShell.push(e));

      fragment.get(UwtLoggerService).getLogger('cart').error('Payment failed');
      fragment
        .get(UwtTelemetrySink)
        .recordError({ name: 'Error', message: 'Something else' });
      await UwtBroadcastChannelStub.settle();

      const error = inShell.find((e) => e.kind === 'error');
      expect(error).toBeDefined();
      expect(error).not.toHaveProperty('relatedSequence');
    });
  });

  describe('robustness', () => {
    it('should keep a host inactive in a realm that forwards its own telemetry, instead of looping', async () => {
      host.ngOnDestroy();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const posts = jest.spyOn(
        UwtBroadcastChannelStub.prototype,
        'postMessage'
      );
      const misconfigured = createRealm([
        UwtBroadcastTelemetrySink,
        { provide: UwtTelemetrySink, useExisting: UwtBroadcastTelemetrySink },
        UwtBroadcastLogApiProvider,
        {
          provide: UWT_LOG_API_PROVIDER,
          useExisting: UwtBroadcastLogApiProvider
        },
        UwtTelemetryBroadcastHost
      ]);
      host = misconfigured.get(UwtTelemetryBroadcastHost);

      misconfigured.get(UwtLoggerService).getLogger('cart').log('once');
      misconfigured
        .get(UwtTelemetrySink)
        .record('com.uwt.bi', { eventName: 'once' });
      await UwtBroadcastChannelStub.settle(10);

      const kinds = posts.mock.calls.map(
        ([message]) => (message as { kind: string }).kind
      );
      expect(kinds.filter((k) => k === 'log')).toHaveLength(1);
      expect(kinds.filter((k) => k === 'event')).toHaveLength(1);
      expect(host.received).toBe(0);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('cannot also host it')
      );
    });

    it('should ignore unrelated traffic on the channel', async () => {
      createFragment();
      const noise = new UwtBroadcastChannelStub('ngx-ui-watchtower');
      noise.postMessage({ some: 'other library' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
      expect(host.received).toBe(0);
    });

    it('should warn when a second host claims the same channel in this realm', () => {
      const channel = 'duplicate-detection-test';
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const providers = [
        RecordingSink,
        { provide: UwtTelemetrySink, useExisting: RecordingSink },
        { provide: UWT_BROADCAST_CHANNEL, useValue: channel }
      ];
      const first = createRealm([...providers, UwtTelemetryBroadcastHost]).get(
        UwtTelemetryBroadcastHost
      );

      expect(warn).not.toHaveBeenCalled();

      createRealm([...providers, UwtTelemetryBroadcastHost]).get(
        UwtTelemetryBroadcastHost
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
        { provide: UwtTelemetrySink, useExisting: RecordingSink },
        { provide: UWT_BROADCAST_CHANNEL, useValue: channel }
      ];
      const first = createRealm([...providers, UwtTelemetryBroadcastHost]).get(
        UwtTelemetryBroadcastHost
      );
      first.ngOnDestroy();

      createRealm([...providers, UwtTelemetryBroadcastHost]).get(
        UwtTelemetryBroadcastHost
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should not let a throwing console.warn crash duplicate-host construction', () => {
      const channel = 'duplicate-detection-throwing-warn-test';
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {
        throw new Error('console is patched and broken');
      });

      const providers = [
        RecordingSink,
        { provide: UwtTelemetrySink, useExisting: RecordingSink },
        { provide: UWT_BROADCAST_CHANNEL, useValue: channel }
      ];
      const first = createRealm([...providers, UwtTelemetryBroadcastHost]).get(
        UwtTelemetryBroadcastHost
      );

      let second: UwtTelemetryBroadcastHost | undefined;
      expect(() => {
        second = createRealm([...providers, UwtTelemetryBroadcastHost]).get(
          UwtTelemetryBroadcastHost
        );
      }).not.toThrow();

      first.ngOnDestroy();
      second?.ngOnDestroy();
      warn.mockRestore();

      const freshWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      createRealm([...providers, UwtTelemetryBroadcastHost]).get(
        UwtTelemetryBroadcastHost
      );
      expect(freshWarn).not.toHaveBeenCalled();
      freshWarn.mockRestore();
    });

    it('should stop delivering once the fragment is destroyed', async () => {
      const fragment = createFragment();
      const sink = fragment.get(UwtBroadcastTelemetrySink);

      sink.ngOnDestroy();
      sink.record('com.uwt.bi', { eventName: 'after-destroy' });

      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
    });

    it('should stop recording once the host is destroyed', async () => {
      const fragment = createFragment();
      host.ngOnDestroy();

      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
    });

    it('should use a separate channel when one is configured', async () => {
      const isolated = createRealm([
        UwtBroadcastTelemetrySink,
        { provide: UwtTelemetrySink, useExisting: UwtBroadcastTelemetrySink },
        { provide: UWT_BROADCAST_CHANNEL, useValue: 'other-network' }
      ]);

      isolated.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      await UwtBroadcastChannelStub.settle();

      expect(shellSink.events).toHaveLength(0);
    });
  });

  describe('leader election', () => {
    let consoleWarn: jest.SpyInstance;
    let createdHosts: UwtTelemetryBroadcastHost[];

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
      host: UwtTelemetryBroadcastHost;
      sink: RecordingSink;
      logs: RecordingLogApi;
    } {
      const sink = new RecordingSink();
      const realm = createRealm([
        { provide: RecordingSink, useValue: sink },
        { provide: UwtTelemetrySink, useExisting: RecordingSink },
        UwtTelemetryBroadcastHost
      ]);
      const realmHost = realm.get(UwtTelemetryBroadcastHost);
      createdHosts.push(realmHost);
      return { host: realmHost, sink, logs: realm.get(RecordingLogApi) };
    }

    it('should keep a second host passive while the first is still leader', async () => {
      const first = createHost();
      const second = createHost();

      const fragment = createFragment();
      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      await UwtBroadcastChannelStub.settle();

      expect(first.sink.events).toHaveLength(1);
      expect(second.sink.events).toHaveLength(0);
      expect(second.host.received).toBe(0);
    });

    it('should leave log records and queries to the leader', async () => {
      const first = createHost();
      const second = createHost();
      const fragment = createFragment();

      fragment.get(UwtLoggerService).getLogger('cart').log('Hello');
      const pending = fragment.get(UwtLoggerService).query({});
      await UwtBroadcastChannelStub.settle();

      expect(first.logs.records).toHaveLength(1);
      expect(second.logs.records).toHaveLength(0);
      expect(second.host.received).toBe(0);
      await expect(pending).resolves.toHaveLength(1);
    });

    it('should hand off leadership once the leader is destroyed', async () => {
      const first = createHost();
      const second = createHost();

      first.host.ngOnDestroy();
      await UwtBroadcastChannelStub.settle();

      const fragment = createFragment();
      fragment.get(UwtTelemetrySink).record('com.uwt.bi', { eventName: 'x' });
      await UwtBroadcastChannelStub.settle();

      expect(second.sink.events).toHaveLength(1);
      expect(second.host.received).toBe(1);
    });
  });

  describe('uwtElectBroadcastHostLeader', () => {
    afterEach(() => LockManagerStub.uninstall());

    it('should elect immediately when the Locks API is unavailable', () => {
      const onElected = jest.fn();
      uwtElectBroadcastHostLeader('ngx-ui-watchtower', onElected);

      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should elect once the lock is granted', () => {
      LockManagerStub.install();
      const onElected = jest.fn();
      uwtElectBroadcastHostLeader('ngx-ui-watchtower', onElected);

      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should fail open and still elect when request() itself rejects', async () => {
      Object.defineProperty(globalThis.navigator, 'locks', {
        value: { request: () => Promise.reject(new Error('not-fully-active')) },
        configurable: true
      });
      const onElected = jest.fn();

      uwtElectBroadcastHostLeader('ngx-ui-watchtower', onElected);
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
        uwtElectBroadcastHostLeader('ngx-ui-watchtower', onElected)
      ).not.toThrow();
      expect(onElected).toHaveBeenCalledTimes(1);
    });

    it('should not elect a requester released while still queued, and should let the next requester through', async () => {
      LockManagerStub.install();
      const onElectedHolder = jest.fn();
      const onElectedA = jest.fn();
      const onElectedB = jest.fn();

      const releaseHolder = uwtElectBroadcastHostLeader(
        'ngx-ui-watchtower',
        onElectedHolder
      );
      const releaseA = uwtElectBroadcastHostLeader(
        'ngx-ui-watchtower',
        onElectedA
      );
      uwtElectBroadcastHostLeader('ngx-ui-watchtower', onElectedB);

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

  describe('uwtIsBroadcastMessage', () => {
    it.each([null, undefined, 'string', 42, ['array']])(
      'should reject the non-object payload %p',
      (data) => {
        expect(uwtIsBroadcastMessage(data)).toBe(false);
      }
    );

    it('should reject a payload with an unknown kind', () => {
      expect(uwtIsBroadcastMessage({ kind: 'other library' })).toBe(false);
    });

    it('should accept a well-formed event message', () => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'event',
          eventType: 'com.uwt.bi',
          payload: { eventName: 'x' }
        })
      ).toBe(true);
    });

    it.each([
      { eventType: 'com.uwt.bi' },
      { payload: {} },
      { eventType: 1, payload: {} },
      { eventType: 'com.uwt.bi', payload: 'not-an-object' },
      {
        eventType: 'com.uwt.bi',
        payload: {},
        metadata: { nested: {} }
      },
      {
        eventType: 'com.uwt.bi',
        payload: {},
        metadata: { list: [1, 2] }
      },
      {
        eventType: 'com.uwt.bi',
        payload: {},
        metadata: 'not-an-object'
      }
    ])('should reject a malformed event message %p', (fields) => {
      expect(uwtIsBroadcastMessage({ kind: 'event', ...fields })).toBe(false);
    });

    it('should accept an event message with flat-primitive metadata', () => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'event',
          eventType: 'com.uwt.bi',
          payload: {},
          metadata: { count: 3, ok: true, note: 'x', blank: null }
        })
      ).toBe(true);
    });

    it('should accept an event message with no metadata', () => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'event',
          eventType: 'com.uwt.bi',
          payload: {}
        })
      ).toBe(true);
    });

    it('should accept a well-formed error message', () => {
      expect(
        uwtIsBroadcastMessage({
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
      { error: { name: 'Error', message: 'boom', stack: 42 } },
      {
        error: { name: 'Error', message: 'boom' },
        metadata: { nested: {} }
      }
    ])('should reject a malformed error message %p', (fields) => {
      expect(uwtIsBroadcastMessage({ kind: 'error', ...fields })).toBe(false);
    });

    it('should accept an error message with flat-primitive metadata', () => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'error',
          error: { name: 'Error', message: 'boom' },
          metadata: { origin: 'checkout' }
        })
      ).toBe(true);
    });

    it('should accept an error message with a string stack', () => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'error',
          error: { name: 'Error', message: 'boom', stack: 'at foo.ts:1' }
        })
      ).toBe(true);
    });

    it('should accept a well-formed flush message', () => {
      expect(uwtIsBroadcastMessage({ kind: 'flush', beacon: true })).toBe(true);
    });

    it('should reject a flush message with a non-boolean beacon', () => {
      expect(uwtIsBroadcastMessage({ kind: 'flush', beacon: 'true' })).toBe(
        false
      );
    });

    it.each([{ userId: 'u-1' }, { userId: undefined }, {}])(
      'should accept a well-formed user message %p',
      (fields) => {
        expect(uwtIsBroadcastMessage({ kind: 'user', ...fields })).toBe(true);
      }
    );

    it('should reject a user message with a non-string, non-undefined userId', () => {
      expect(uwtIsBroadcastMessage({ kind: 'user', userId: 42 })).toBe(false);
    });

    const logRecord = {
      timestamp: '2026-01-01T00:00:00.000Z',
      level: 'warn',
      message: 'Careful',
      application: 'cart',
      environment: 'test',
      version: '1.0.0'
    };

    it('should accept a well-formed log message', () => {
      expect(uwtIsBroadcastMessage({ kind: 'log', record: logRecord })).toBe(
        true
      );
      expect(
        uwtIsBroadcastMessage({
          kind: 'log',
          record: {
            ...logRecord,
            logger: 'checkout',
            context: 'Cart',
            correlationId: 'c-1',
            sessionId: 's',
            userId: 'u',
            metadata: { count: 1 },
            error: { name: 'Error', message: 'boom' }
          }
        })
      ).toBe(true);
    });

    it.each([
      { level: 'debug' },
      { level: 'toString' },
      { application: undefined },
      { message: 42 },
      { logger: 7 },
      { metadata: { nested: {} } },
      { error: { name: 'Error' } }
    ])('should reject a log message whose record has %p', (fields) => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'log',
          record: { ...logRecord, ...fields }
        })
      ).toBe(false);
    });

    it('should accept log-flush, log-query and log-query-result messages', () => {
      expect(uwtIsBroadcastMessage({ kind: 'log-flush' })).toBe(true);
      expect(
        uwtIsBroadcastMessage({
          kind: 'log-query',
          id: 'q-1',
          filter: { correlationId: 'c-1', minLevel: 'warn', limit: 5 }
        })
      ).toBe(true);
      expect(
        uwtIsBroadcastMessage({
          kind: 'log-query-result',
          id: 'q-1',
          records: []
        })
      ).toBe(true);
    });

    it.each([
      { id: '', filter: {} },
      { id: 'q-1', filter: null },
      { id: 'q-1', filter: { limit: 'ten' } },
      { id: 'q-1', filter: { minLevel: 'verbose' } }
    ])('should reject a malformed log-query message %p', (fields) => {
      expect(uwtIsBroadcastMessage({ kind: 'log-query', ...fields })).toBe(
        false
      );
    });

    it('should reject a log-query-result without a records array', () => {
      expect(
        uwtIsBroadcastMessage({
          kind: 'log-query-result',
          id: 'q-1',
          records: 'none'
        })
      ).toBe(false);
    });

    it('should accept an identity-request message with no other fields', () => {
      expect(uwtIsBroadcastMessage({ kind: 'identity-request' })).toBe(true);
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
      expect(uwtIsBroadcastMessage({ kind: 'identity', ...fields })).toBe(true);
    });

    it.each([{ sessionId: 42 }, { userId: 42 }, { sessionId: 42, userId: 42 }])(
      'should reject an identity message with a non-string, non-undefined field %p',
      (fields) => {
        expect(uwtIsBroadcastMessage({ kind: 'identity', ...fields })).toBe(
          false
        );
      }
    );
  });

  describe('uwtConnectBroadcastChannel', () => {
    it('should default the channel name to UWT_DEFAULT_BROADCAST_CHANNEL', () => {
      const connection = TestBed.runInInjectionContext(() =>
        uwtConnectBroadcastChannel('test')
      );
      expect(connection.channelName).toBe(UWT_DEFAULT_BROADCAST_CHANNEL);
    });

    it('should read an overridden channel name from UWT_BROADCAST_CHANNEL', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: UWT_BROADCAST_CHANNEL, useValue: 'my-channel' }]
      });
      const connection = TestBed.runInInjectionContext(() =>
        uwtConnectBroadcastChannel('test')
      );
      expect(connection.channelName).toBe('my-channel');
    });

    it('should invoke the registered handler for an incoming message', async () => {
      const connection = TestBed.runInInjectionContext(() =>
        uwtConnectBroadcastChannel('test')
      );
      const received: unknown[] = [];
      connection.onMessage((data) => received.push(data));

      const peer = new UwtBroadcastChannelStub(UWT_DEFAULT_BROADCAST_CHANNEL);
      peer.postMessage({ kind: 'flush', beacon: true });
      await UwtBroadcastChannelStub.settle();

      expect(received).toEqual([{ kind: 'flush', beacon: true }]);
    });

    it('should stop delivering to a closed connection', async () => {
      const connection = TestBed.runInInjectionContext(() =>
        uwtConnectBroadcastChannel('test')
      );
      const received: unknown[] = [];
      connection.onMessage((data) => received.push(data));
      expect(connection.isOpen()).toBe(true);
      connection.close();
      expect(connection.isOpen()).toBe(false);

      const peer = new UwtBroadcastChannelStub(UWT_DEFAULT_BROADCAST_CHANNEL);
      peer.postMessage({ kind: 'flush', beacon: true });
      await UwtBroadcastChannelStub.settle();

      expect(received).toEqual([]);
    });

    it('should degrade to a safe no-op when BroadcastChannel is unavailable', () => {
      UwtBroadcastChannelStub.uninstall();
      const connection = TestBed.runInInjectionContext(() =>
        uwtConnectBroadcastChannel('test')
      );

      expect(() => {
        connection.post({ kind: 'identity-request' });
        connection.onMessage(() => undefined);
        connection.close();
      }).not.toThrow();
      expect(connection.isOpen()).toBe(false);
    });
  });

  describe('without BroadcastChannel support', () => {
    beforeEach(() => UwtBroadcastChannelStub.uninstall());

    it('should degrade to a no-op sink rather than throwing', () => {
      const fragment = createFragment();
      const sink = fragment.get(UwtTelemetrySink);

      expect(() => {
        sink.record('com.uwt.bi', { eventName: 'x' });
        sink.recordError({ name: 'Error', message: 'boom' });
        sink.setUserId('user-1');
        sink.flush(true);
      }).not.toThrow();
      expect(sink.getSessionId()).toBeUndefined();
    });

    it('should resolve a fragment log query to [] at once', async () => {
      const fragment = createFragment();
      await expect(fragment.get(UwtLoggerService).query({})).resolves.toEqual(
        []
      );
    });

    it('should let a scenario run to completion in the fragment', () => {
      const fragment = createFragment();
      const scenarioTelemetry = fragment.get(UwtScenarioTelemetryService);

      const scenario = scenarioTelemetry.start({ name: 'add-to-cart' });
      expect(() => scenario.step('one').complete()).not.toThrow();
      expect(scenario.status).toBe('success');
    });
  });
});
