import {
  cpsClearMarks,
  cpsMark,
  cpsMarkName,
  cpsMeasure
} from './cps-user-timings-internal.util';

/**
 * jsdom implements `performance.now` and `timeOrigin` but neither `mark` nor
 * `measure`, so the API has to be installed to test the supported path — and
 * the unsupported path is simply the default.
 */
function installUserTimingApi(overrides: Record<string, unknown> = {}) {
  const api = {
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    now: () => 0,
    timeOrigin: 0,
    ...overrides
  };

  Object.defineProperty(globalThis, 'performance', {
    value: api,
    configurable: true
  });

  return api;
}

describe('cps-user-timings', () => {
  const realPerformance = globalThis.performance;

  afterEach(() => {
    Object.defineProperty(globalThis, 'performance', {
      value: realPerformance,
      configurable: true
    });
    jest.restoreAllMocks();
  });

  describe('cpsMarkName', () => {
    it('should namespace the entry and include the scenario id', () => {
      expect(cpsMarkName('shop', 'load-data', 'abc-123', 'fetch')).toBe(
        'shop:load-data:fetch:abc-123'
      );
    });

    it('should namespace by application, not by this library', () => {
      expect(cpsMarkName('checkout', 'load', 'id-1', 'start')).toBe(
        'checkout:load:start:id-1'
      );
    });

    it('should keep two applications apart on one composed page', () => {
      expect(cpsMarkName('shell', 'load', 'id-1', 'start')).not.toBe(
        cpsMarkName('cart', 'load', 'id-1', 'start')
      );
    });

    it('should distinguish concurrent scenarios of the same name', () => {
      expect(cpsMarkName('shop', 'load', 'id-1', 'start')).not.toBe(
        cpsMarkName('shop', 'load', 'id-2', 'start')
      );
    });
  });

  describe('when the browser has no User Timing API', () => {
    it('should no-op rather than throw', () => {
      expect(() => cpsMark('m')).not.toThrow();
      expect(() => cpsMeasure('name', 'a', 'b')).not.toThrow();
      expect(() => cpsClearMarks(['a', 'b'])).not.toThrow();
    });

    it('should touch nothing when the API is only partly present', () => {
      const api = installUserTimingApi({ measure: undefined });

      expect(() => cpsMark('m')).not.toThrow();
      expect(api.mark).not.toHaveBeenCalled();
    });
  });

  describe('when the browser supports User Timing', () => {
    it('should record a mark', () => {
      const api = installUserTimingApi();
      cpsMark('cps:load:start:id');
      expect(api.mark).toHaveBeenCalledWith('cps:load:start:id');
    });

    it('should record a measure between two marks', () => {
      const api = installUserTimingApi();
      cpsMeasure('load [fetch]', 'start-mark', 'end-mark');
      expect(api.measure).toHaveBeenCalledWith(
        'load [fetch]',
        'start-mark',
        'end-mark'
      );
    });

    it('should drop the measure entry once created, to bound the buffer', () => {
      const api = installUserTimingApi();
      cpsMeasure('load', 'a', 'b');
      expect(api.clearMeasures).toHaveBeenCalledWith('load');
    });

    it('should swallow a measure against a missing mark', () => {
      const api = installUserTimingApi({
        measure: jest.fn(() => {
          throw new SyntaxError("mark 'a' does not exist");
        })
      });

      expect(() => cpsMeasure('load', 'a', 'b')).not.toThrow();
      expect(api.clearMeasures).not.toHaveBeenCalled();
    });

    it('should swallow a throwing mark', () => {
      installUserTimingApi({
        mark: jest.fn(() => {
          throw new Error('quota exceeded');
        })
      });
      expect(() => cpsMark('m')).not.toThrow();
    });

    it('should clear every named mark', () => {
      const api = installUserTimingApi();
      cpsClearMarks(['a', 'b', 'c']);

      expect(api.clearMarks).toHaveBeenCalledTimes(3);
      expect(api.clearMarks).toHaveBeenCalledWith('a');
      expect(api.clearMarks).toHaveBeenCalledWith('c');
    });

    it('should keep clearing after one mark throws', () => {
      const api = installUserTimingApi({
        clearMarks: jest.fn((name: string) => {
          if (name === 'a') {
            throw new Error('gone');
          }
        })
      });

      expect(() => cpsClearMarks(['a', 'b'])).not.toThrow();
      expect(api.clearMarks).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolving the host performance object (see DESIGN.md §13)', () => {
    // jsdom's `globalThis.top` is a non-configurable accessor always equal
    // to `globalThis` itself, so a divergent `top` (a real fragment under a
    // different frame) can't be constructed here — every mark/measure/clear
    // test above already exercises the `top.performance` branch, just with
    // `top` equal to `globalThis`.
    it('should read the same object jsdom exposes as globalThis.top', () => {
      expect(globalThis.top).toBe(globalThis);
    });
  });
});
