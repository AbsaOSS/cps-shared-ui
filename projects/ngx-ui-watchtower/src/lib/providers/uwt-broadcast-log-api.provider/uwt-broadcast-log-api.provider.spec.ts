import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UwtLogRecord } from '../../models/uwt-log.models/uwt-log.models';
import { UWT_BROADCAST_CHANNEL } from '../../sinks/uwt-broadcast/uwt-broadcast.messages';
import {
  UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS,
  UwtBroadcastLogApiProvider
} from './uwt-broadcast-log-api.provider';

/**
 * Stands in for `BroadcastChannel`: keeps what the provider posts, and lets
 * a test deliver a message to it as the host would.
 */
class ChannelStub {
  static instances = [] as ChannelStub[];

  onmessage: ((event: { data: unknown }) => void) | null = null;
  readonly posted: unknown[] = [];
  closed = false;

  constructor(readonly name: string) {
    ChannelStub.instances.push(this);
  }

  static install(): void {
    ChannelStub.instances = [];
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      value: ChannelStub,
      configurable: true,
      writable: true
    });
  }

  static uninstall(): void {
    delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
  }

  postMessage(message: unknown): void {
    this.posted.push(message);
  }

  close(): void {
    this.closed = true;
  }

  deliver(data: unknown): void {
    this.onmessage?.({ data });
  }
}

const record: UwtLogRecord = {
  timestamp: '2026-01-01T00:00:00.000Z',
  level: 'warn',
  message: 'Careful now',
  logger: 'cart',
  application: 'cart',
  environment: 'test',
  version: '1.0.0'
};

describe('UwtBroadcastLogApiProvider', () => {
  let provider: UwtBroadcastLogApiProvider;
  let channel: ChannelStub;

  /** The id of the latest query the provider posted. */
  function lastQueryId(): string {
    const queries = channel.posted.filter(
      (m) => (m as { kind: string }).kind === 'log-query'
    );
    return (queries[queries.length - 1] as { id: string }).id;
  }

  function create(): void {
    TestBed.configureTestingModule({ providers: [UwtBroadcastLogApiProvider] });
    provider = TestBed.inject(UwtBroadcastLogApiProvider);
    channel = ChannelStub.instances[0];
  }

  beforeEach(() => {
    ChannelStub.install();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    ChannelStub.uninstall();
    jest.useRealTimers();
  });

  describe('with a channel', () => {
    beforeEach(() => create());

    it('should open the default channel', () => {
      expect(channel.name).toBe('ngx-ui-watchtower');
    });

    it('should post each record as it is sent', () => {
      provider.send(record);

      expect(channel.posted).toEqual([{ kind: 'log', record }]);
    });

    it('should post a flush request', () => {
      provider.flush();

      expect(channel.posted).toEqual([{ kind: 'log-flush' }]);
    });

    it('should post a query with a fresh id and the filter', () => {
      provider.query({ correlationId: 'c-1' });
      provider.query({ correlationId: 'c-1' });

      const [first, second] = channel.posted as {
        kind: string;
        id: string;
        filter: unknown;
      }[];
      expect(first).toEqual({
        kind: 'log-query',
        id: expect.any(String),
        filter: { correlationId: 'c-1' }
      });
      expect(second.id).not.toBe(first.id);
    });

    it('should resolve a query with the answer to its id', async () => {
      const pending = provider.query({});

      channel.deliver({
        kind: 'log-query-result',
        id: lastQueryId(),
        records: [record]
      });

      await expect(pending).resolves.toEqual([record]);
    });

    it('should keep only well-formed records from the answer', async () => {
      const pending = provider.query({});

      channel.deliver({
        kind: 'log-query-result',
        id: lastQueryId(),
        records: [record, { junk: true }, { ...record, level: 'verbose' }]
      });

      await expect(pending).resolves.toEqual([record]);
    });

    it('should ignore an answer to another id, and anything that is not an answer', async () => {
      jest.useFakeTimers();
      let result: UwtLogRecord[] | undefined;
      provider.query({}).then((records) => (result = records));

      channel.deliver({
        kind: 'log-query-result',
        id: 'someone-else',
        records: [record]
      });
      channel.deliver({ kind: 'identity', sessionId: 's' });
      channel.deliver('not a message');
      await Promise.resolve();
      expect(result).toBeUndefined();

      channel.deliver({
        kind: 'log-query-result',
        id: lastQueryId(),
        records: []
      });
      await Promise.resolve();
      expect(result).toEqual([]);
    });

    it('should resolve an unanswered query to [] once the timeout passes, not before', async () => {
      jest.useFakeTimers();
      let result: UwtLogRecord[] | undefined;
      provider.query({}).then((records) => (result = records));

      await jest.advanceTimersByTimeAsync(
        UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS - 1
      );
      expect(result).toBeUndefined();

      await jest.advanceTimersByTimeAsync(1);
      expect(result).toEqual([]);
    });

    it('should ignore an answer that arrives after the timeout', async () => {
      jest.useFakeTimers();
      const pending = provider.query({});
      const id = lastQueryId();

      await jest.advanceTimersByTimeAsync(UWT_BROADCAST_LOG_QUERY_TIMEOUT_MS);
      channel.deliver({ kind: 'log-query-result', id, records: [record] });

      await expect(pending).resolves.toEqual([]);
    });

    it('should resolve unanswered queries to [] and close the channel when destroyed', async () => {
      const first = provider.query({});
      const second = provider.query({});

      TestBed.resetTestingModule();

      await expect(first).resolves.toEqual([]);
      await expect(second).resolves.toEqual([]);
      expect(channel.closed).toBe(true);
    });

    it('should resolve a query made after destruction to [] at once, posting nothing', async () => {
      provider.ngOnDestroy();
      const postedBefore = channel.posted.length;

      await expect(provider.query({})).resolves.toEqual([]);
      expect(channel.posted).toHaveLength(postedBefore);
    });
  });

  it('should use the configured channel name', () => {
    TestBed.configureTestingModule({
      providers: [
        UwtBroadcastLogApiProvider,
        { provide: UWT_BROADCAST_CHANNEL, useValue: 'my-channel' }
      ]
    });
    TestBed.inject(UwtBroadcastLogApiProvider);

    expect(ChannelStub.instances[0].name).toBe('my-channel');
  });

  it('should run the timeout outside the Angular zone and resolve inside it', async () => {
    create();
    const zone = TestBed.inject(NgZone);
    const runOutsideAngular = jest.spyOn(zone, 'runOutsideAngular');
    const run = jest.spyOn(zone, 'run');

    const pending = provider.query({});
    expect(runOutsideAngular).toHaveBeenCalledTimes(1);
    expect(run).not.toHaveBeenCalled();

    channel.deliver({
      kind: 'log-query-result',
      id: lastQueryId(),
      records: []
    });

    await expect(pending).resolves.toEqual([]);

    expect(run).toHaveBeenCalled();
  });

  describe('without BroadcastChannel', () => {
    beforeEach(() => {
      ChannelStub.uninstall();
      TestBed.configureTestingModule({
        providers: [UwtBroadcastLogApiProvider]
      });
      provider = TestBed.inject(UwtBroadcastLogApiProvider);
    });

    it('should resolve a query to [] at once', async () => {
      await expect(provider.query({})).resolves.toEqual([]);
    });

    it('should accept send and flush without throwing', () => {
      expect(() => {
        provider.send(record);
        provider.flush();
        provider.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
