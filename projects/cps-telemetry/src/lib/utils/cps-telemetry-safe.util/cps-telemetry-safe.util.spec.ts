import { isDevMode } from '@angular/core';
import {
  cpsEpochToPerf,
  cpsNow,
  cpsSafe,
  cpsSafeVoid,
  cpsSafeVoidMaybeAsync,
  cpsUuid
} from './cps-telemetry-safe.util';

jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  isDevMode: jest.fn(() => true)
}));

const isDevModeMock = isDevMode as jest.Mock;

describe('cpsSafe', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    isDevModeMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the result when the operation succeeds', () => {
    expect(cpsSafe('op', () => 42, 0)).toBe(42);
  });

  it('should return the fallback instead of throwing', () => {
    const result = cpsSafe(
      'op',
      () => {
        throw new Error('boom');
      },
      'fallback'
    );
    expect(result).toBe('fallback');
  });

  it('should never let a telemetry failure reach the caller', () => {
    expect(() =>
      cpsSafeVoid('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
  });

  it('should report the suppressed error in development mode', () => {
    isDevModeMock.mockReturnValue(true);
    cpsSafeVoid('scenario.step', () => {
      throw new Error('boom');
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[cps-telemetry] scenario.step failed',
      expect.any(Error)
    );
  });

  it('should stay silent in production mode', () => {
    isDevModeMock.mockReturnValue(false);
    cpsSafeVoid('scenario.step', () => {
      throw new Error('boom');
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('should not rethrow even when the dev-mode report itself throws', () => {
    isDevModeMock.mockImplementation(() => {
      throw new Error('outside injection context');
    });
    expect(() =>
      cpsSafeVoid('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
  });
});

describe('cpsSafeVoidMaybeAsync', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    isDevModeMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should behave exactly like cpsSafeVoid for a synchronous function', () => {
    expect(() =>
      cpsSafeVoidMaybeAsync('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      '[cps-telemetry] op failed',
      expect.any(Error)
    );
  });

  it('should not throw for a function that returns void', () => {
    expect(() => cpsSafeVoidMaybeAsync('op', () => undefined)).not.toThrow();
  });

  it('should report a rejection from an async function typed as void', async () => {
    const asyncFn = (async () => {
      throw new Error('async boom');
    }) as () => void;

    cpsSafeVoidMaybeAsync('logApi.deliver', asyncFn);

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      '[cps-telemetry] logApi.deliver failed',
      expect.any(Error)
    );
  });

  it('should not produce an unhandled rejection for a rejecting async function', async () => {
    const asyncFn = (async () => {
      throw new Error('unhandled if unguarded');
    }) as () => void;

    expect(() => cpsSafeVoidMaybeAsync('op', asyncFn)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });

  it('should stay silent in production mode for an async rejection', async () => {
    isDevModeMock.mockReturnValue(false);
    const asyncFn = (async () => {
      throw new Error('async boom');
    }) as () => void;

    cpsSafeVoidMaybeAsync('op', asyncFn);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('cpsUuid', () => {
  const realCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: realCrypto,
      configurable: true
    });
  });

  const useCrypto = (value: unknown) =>
    Object.defineProperty(globalThis, 'crypto', {
      value,
      configurable: true
    });

  it('should produce a UUID-shaped identifier', () => {
    expect(cpsUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('should produce distinct identifiers', () => {
    const ids = new Set(Array.from({ length: 200 }, () => cpsUuid()));
    expect(ids.size).toBe(200);
  });

  it('should fall back to getRandomValues when randomUUID is unavailable', () => {
    useCrypto({
      getRandomValues: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i;
        }
        return array;
      }
    });

    expect(cpsUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should fall back to Math.random when the Web Crypto API is absent', () => {
    useCrypto(undefined);

    expect(cpsUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe('cpsNow', () => {
  it('should return a number that does not go backwards', () => {
    const first = cpsNow();
    const second = cpsNow();
    expect(typeof first).toBe('number');
    expect(second).toBeGreaterThanOrEqual(first);
  });
});

describe('cpsEpochToPerf', () => {
  const realPerformance = globalThis.performance;

  afterEach(() => {
    Object.defineProperty(globalThis, 'performance', {
      value: realPerformance,
      configurable: true
    });
  });

  function usePerformance(timeOrigin: number, now: number) {
    Object.defineProperty(globalThis, 'performance', {
      value: { timeOrigin, now: () => now },
      configurable: true
    });
  }

  it('should convert an epoch timestamp into the performance timeline', () => {
    usePerformance(1_000_000, 5_000);
    expect(cpsEpochToPerf(1_002_000)).toBe(2_000);
  });

  it('should accept the exact page origin', () => {
    usePerformance(1_000_000, 5_000);
    expect(cpsEpochToPerf(1_000_000)).toBe(0);
  });

  it('should reject a timestamp from before the page loaded', () => {
    usePerformance(1_000_000, 5_000);
    expect(cpsEpochToPerf(999_000)).toBeUndefined();
  });

  it('should reject a timestamp in the future', () => {
    usePerformance(1_000_000, 5_000);
    expect(cpsEpochToPerf(1_010_000)).toBeUndefined();
  });

  it.each([[NaN], [Infinity], [-Infinity]])(
    'should reject the non-finite input %p',
    (input) => {
      usePerformance(1_000_000, 5_000);
      expect(cpsEpochToPerf(input)).toBeUndefined();
    }
  );

  it('should return undefined without a usable performance object', () => {
    Object.defineProperty(globalThis, 'performance', {
      value: undefined,
      configurable: true
    });
    expect(cpsEpochToPerf(1_000)).toBeUndefined();
  });
});
