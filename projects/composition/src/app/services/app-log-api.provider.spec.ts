import { TestBed } from '@angular/core/testing';
import { CpsLogRecord } from 'cps-telemetry';
import { AppLogApiProvider } from './app-log-api.provider';

/** Builds a minimal, valid CpsLogRecord, overridable per test. */
function record(overrides: Partial<CpsLogRecord> = {}): CpsLogRecord {
  return {
    timestamp: '2024-01-01T00:00:00.000Z',
    level: 'log',
    message: 'hello',
    application: 'composition',
    environment: 'test',
    version: '1.0.0',
    ...overrides
  };
}

describe('AppLogApiProvider', () => {
  let provider: AppLogApiProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(AppLogApiProvider);
  });

  describe('send / getRecords', () => {
    it('should retain sent records, oldest first', () => {
      provider.send(record({ message: 'first' }));
      provider.send(record({ message: 'second' }));

      expect(provider.getRecords().map((r) => r.message)).toEqual([
        'first',
        'second'
      ]);
    });

    it('should return a copy, not the live buffer', () => {
      provider.send(record());
      const records = provider.getRecords();
      records.push(record({ message: 'injected' }));

      expect(provider.getRecords()).toHaveLength(1);
    });

    it('should evict the oldest records once the buffer limit is exceeded', () => {
      for (let i = 0; i < 505; i++) {
        provider.send(record({ message: `msg-${i}` }));
      }

      const records = provider.getRecords();
      expect(records).toHaveLength(500);
      expect(records[0].message).toBe('msg-5');
      expect(records[records.length - 1].message).toBe('msg-504');
    });
  });

  describe('query', () => {
    beforeEach(() => {
      provider.send(
        record({
          correlationId: 'c-1',
          logger: 'checkout',
          level: 'log',
          timestamp: '2024-01-01T00:00:00.000Z'
        })
      );
      provider.send(
        record({
          correlationId: 'c-2',
          logger: 'checkout',
          level: 'warn',
          timestamp: '2024-01-02T00:00:00.000Z'
        })
      );
      provider.send(
        record({
          correlationId: 'c-1',
          logger: 'admin',
          level: 'error',
          timestamp: '2024-01-03T00:00:00.000Z'
        })
      );
    });

    it('should filter by correlationId', async () => {
      const found = await provider.query({ correlationId: 'c-1' });
      expect(found.map((r) => r.logger)).toEqual(['checkout', 'admin']);
    });

    it('should filter by logger', async () => {
      const found = await provider.query({ logger: 'admin' });
      expect(found).toHaveLength(1);
      expect(found[0].correlationId).toBe('c-1');
    });

    it('should filter by minLevel, keeping that level and above', async () => {
      const found = await provider.query({ minLevel: 'warn' });
      expect(found.map((r) => r.level)).toEqual(['warn', 'error']);
    });

    it('should filter by an inclusive from/to timestamp range', async () => {
      const found = await provider.query({
        from: '2024-01-02T00:00:00.000Z',
        to: '2024-01-02T00:00:00.000Z'
      });
      expect(found).toHaveLength(1);
      expect(found[0].correlationId).toBe('c-2');
    });

    it('should cap the result at limit', async () => {
      const found = await provider.query({ limit: 2 });
      expect(found).toHaveLength(2);
    });

    it('should combine filters with AND', async () => {
      const found = await provider.query({
        correlationId: 'c-1',
        logger: 'checkout'
      });
      expect(found).toHaveLength(1);
      expect(found[0].logger).toBe('checkout');
    });

    it('should return everything when the filter is empty', async () => {
      const found = await provider.query({});
      expect(found).toHaveLength(3);
    });
  });

  describe('download', () => {
    // jsdom has no URL.createObjectURL/revokeObjectURL, so these are assigned
    // directly rather than jest.spyOn, which needs the property to exist.
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      jest.restoreAllMocks();
    });

    it('should do nothing when URL.createObjectURL is unavailable', () => {
      // @ts-expect-error removing it to exercise the guard
      delete URL.createObjectURL;

      provider.send(record());
      expect(() => provider.download()).not.toThrow();
    });

    it('should build and click a download link, then revoke the object URL', () => {
      const objectUrl = 'blob:mock-url';
      URL.createObjectURL = jest.fn(() => objectUrl);
      URL.revokeObjectURL = jest.fn();
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);

      provider.send(record({ message: 'downloadable' }));
      provider.download('my-logs.json');

      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl);
      expect(document.querySelector('a[download]')).toBeNull();
    });

    it('should revoke the object URL even if the click throws', () => {
      URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = jest.fn();
      jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {
          throw new Error('blocked by browser');
        });

      provider.send(record());
      expect(() => provider.download()).toThrow('blocked by browser');
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
