import { isDevMode } from '@angular/core';
import {
  uwtDeepClone,
  uwtElapsedNow,
  uwtEpochToPerf,
  uwtNow,
  uwtSafe,
  uwtSafeVoid,
  uwtSafeVoidMaybeAsync,
  uwtUuid
} from './uwt-telemetry-safe.util';

jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  isDevMode: jest.fn(() => true)
}));

const isDevModeMock = isDevMode as jest.Mock;

describe('uwtSafe', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    isDevModeMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the result when the operation succeeds', () => {
    expect(uwtSafe('op', () => 42, 0)).toBe(42);
  });

  it('should return the fallback instead of throwing', () => {
    const result = uwtSafe(
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
      uwtSafeVoid('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
  });

  it('should report the suppressed error in development mode', () => {
    isDevModeMock.mockReturnValue(true);
    uwtSafeVoid('scenario.step', () => {
      throw new Error('boom');
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[ngx-ui-watchtower] scenario.step failed',
      expect.any(Error)
    );
  });

  it('should stay silent in production mode', () => {
    isDevModeMock.mockReturnValue(false);
    uwtSafeVoid('scenario.step', () => {
      throw new Error('boom');
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('should not rethrow even when the dev-mode report itself throws', () => {
    isDevModeMock.mockImplementation(() => {
      throw new Error('outside injection context');
    });
    expect(() =>
      uwtSafeVoid('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
  });

  it('should not rethrow when console.error itself throws', () => {
    consoleError.mockImplementation(() => {
      throw new Error('console is patched and broken');
    });
    expect(() =>
      uwtSafeVoid('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
  });
});

describe('uwtSafeVoidMaybeAsync', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    isDevModeMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should behave exactly like uwtSafeVoid for a synchronous function', () => {
    expect(() =>
      uwtSafeVoidMaybeAsync('op', () => {
        throw new Error('boom');
      })
    ).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      '[ngx-ui-watchtower] op failed',
      expect.any(Error)
    );
  });

  it('should not throw for a function that returns void', () => {
    expect(() => uwtSafeVoidMaybeAsync('op', () => undefined)).not.toThrow();
  });

  it('should report a rejection from an async function typed as void', async () => {
    const asyncFn = (async () => {
      throw new Error('async boom');
    }) as () => void;

    uwtSafeVoidMaybeAsync('logApi.deliver', asyncFn);

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      '[ngx-ui-watchtower] logApi.deliver failed',
      expect.any(Error)
    );
  });

  it('should not produce an unhandled rejection for a rejecting async function', async () => {
    const asyncFn = (async () => {
      throw new Error('unhandled if unguarded');
    }) as () => void;

    expect(() => uwtSafeVoidMaybeAsync('op', asyncFn)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });

  it('should stay silent in production mode for an async rejection', async () => {
    isDevModeMock.mockReturnValue(false);
    const asyncFn = (async () => {
      throw new Error('async boom');
    }) as () => void;

    uwtSafeVoidMaybeAsync('op', asyncFn);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('should not produce a new unhandled rejection when console.error itself throws', async () => {
    const nodeProcess = (
      globalThis as unknown as {
        process: {
          on(
            event: 'unhandledRejection',
            listener: (reason: unknown) => void
          ): void;
          off(
            event: 'unhandledRejection',
            listener: (reason: unknown) => void
          ): void;
        };
      }
    ).process;

    const unhandled = jest.fn();
    nodeProcess.on('unhandledRejection', unhandled);
    consoleError.mockImplementation(() => {
      throw new Error('console is patched and broken');
    });
    const asyncFn = (async () => {
      throw new Error('async boom');
    }) as () => void;

    uwtSafeVoidMaybeAsync('op', asyncFn);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    nodeProcess.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe('uwtDeepClone', () => {
  it('should produce a deep copy that mutation of the original does not affect', () => {
    const original = { a: 1, nested: { b: [1, 2, 3] } };
    const clone = uwtDeepClone(original);

    original.nested.b.push(4);

    expect(clone).toEqual({ a: 1, nested: { b: [1, 2, 3] } });
    expect(clone).not.toBe(original);
    expect(clone.nested).not.toBe(original.nested);
  });

  it('should fall back to a JSON round-trip when structuredClone is unavailable', () => {
    const realStructuredClone = globalThis.structuredClone;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).structuredClone = undefined;

    try {
      expect(uwtDeepClone({ a: 1, nested: { b: 2 } })).toEqual({
        a: 1,
        nested: { b: 2 }
      });
    } finally {
      globalThis.structuredClone = realStructuredClone;
    }
  });

  it('should fall back to a JSON round-trip when structuredClone throws', () => {
    const realStructuredClone = globalThis.structuredClone;
    globalThis.structuredClone = () => {
      throw new Error('cannot clone');
    };

    try {
      expect(uwtDeepClone({ a: 1 })).toEqual({ a: 1 });
    } finally {
      globalThis.structuredClone = realStructuredClone;
    }
  });
});

describe('uwtUuid', () => {
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
    expect(uwtUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('should produce distinct identifiers', () => {
    const ids = new Set(Array.from({ length: 200 }, () => uwtUuid()));
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

    expect(uwtUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should fall back to Math.random when the Web Crypto API is absent', () => {
    useCrypto(undefined);

    expect(uwtUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe('uwtNow', () => {
  it('should return a number that does not go backwards', () => {
    const first = uwtNow();
    const second = uwtNow();
    expect(typeof first).toBe('number');
    expect(second).toBeGreaterThanOrEqual(first);
  });
});

describe('uwtElapsedNow', () => {
  it('should return a number that does not go backwards', () => {
    const first = uwtElapsedNow();
    const second = uwtElapsedNow();
    expect(typeof first).toBe('number');
    expect(second).toBeGreaterThanOrEqual(first);
  });

  it('should read the same object jsdom exposes as globalThis.top', () => {
    expect(globalThis.top).toBe(globalThis);
  });
});

describe('uwtEpochToPerf', () => {
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
    expect(uwtEpochToPerf(1_002_000)).toBe(2_000);
  });

  it('should accept the exact page origin', () => {
    usePerformance(1_000_000, 5_000);
    expect(uwtEpochToPerf(1_000_000)).toBe(0);
  });

  it('should reject a timestamp from before the page loaded', () => {
    usePerformance(1_000_000, 5_000);
    expect(uwtEpochToPerf(999_000)).toBeUndefined();
  });

  it('should reject a timestamp in the future', () => {
    usePerformance(1_000_000, 5_000);
    expect(uwtEpochToPerf(1_010_000)).toBeUndefined();
  });

  it.each([[NaN], [Infinity], [-Infinity]])(
    'should reject the non-finite input %p',
    (input) => {
      usePerformance(1_000_000, 5_000);
      expect(uwtEpochToPerf(input)).toBeUndefined();
    }
  );

  it('should return undefined without a usable performance object', () => {
    Object.defineProperty(globalThis, 'performance', {
      value: undefined,
      configurable: true
    });
    expect(uwtEpochToPerf(1_000)).toBeUndefined();
  });
});
