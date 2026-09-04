import { isPlatformBrowser } from '@angular/common';
import { inject, isDevMode, PLATFORM_ID } from '@angular/core';

/**
 * Runs a telemetry operation without letting it affect the application.
 *
 * Every public entry point in this library routes through this wrapper —
 * it never rethrows. In development the caught error is reported to the
 * console; in production nothing is printed.
 */
export function cpsSafe<T>(operation: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    reportSuppressed(operation, error);
    return fallback;
  }
}

/**
 * Void-returning form of {@link cpsSafe}, for the common case of an emit call
 * whose result nobody reads.
 */
export function cpsSafeVoid(operation: string, fn: () => void): void {
  cpsSafe(operation, fn, undefined);
}

/**
 * Like {@link cpsSafeVoid}, but also catches a rejection from a `void`-typed
 * extension point whose real implementation turns out to be `async` — an
 * application-supplied provider hook, for instance. TypeScript accepts an
 * `async` function wherever `() => void` is expected and discards the
 * promise, so a plain `try`/`catch` can't see it reject. This checks for a
 * thenable result and attaches a rejection handler.
 *
 * Not the default for every call: most `cpsSafeVoid` calls wrap this
 * library's own synchronous code, where the extra check is pure overhead.
 * Use this only for a function whose shape this library merely declares.
 */
export function cpsSafeVoidMaybeAsync(operation: string, fn: () => void): void {
  cpsSafe(
    operation,
    () => {
      const result: unknown = fn();
      if (
        result !== null &&
        typeof result === 'object' &&
        typeof (result as { then?: unknown }).then === 'function'
      ) {
        Promise.resolve(result as PromiseLike<unknown>).catch((error) =>
          reportSuppressed(operation, error)
        );
      }
    },
    undefined
  );
}

/** `isDevMode()` throws outside an Angular context, so this guards that once for every caller. */
export function cpsIsDevMode(): boolean {
  try {
    return isDevMode();
  } catch {
    return false;
  }
}

/**
 * Whether this code is running in a browser, as opposed to a server-side
 * render. Must be called from an injection context, same as
 * `inject(PLATFORM_ID)` itself requires.
 */
export function cpsIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

/**
 * Deep-clones a plain-data value. Prefers `structuredClone`; falls back to
 * a JSON round-trip where it's unavailable (e.g. under jsdom) or throws.
 */
export function cpsDeepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // fall through to the JSON fallback
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function reportSuppressed(operation: string, error: unknown): void {
  if (!cpsIsDevMode()) {
    return;
  }
  try {
    // eslint-disable-next-line no-console
    console.error(`[cps-telemetry] ${operation} failed`, error);
  } catch {
    // A patched/throwing console must never escape telemetry suppression.
  }
}

/**
 * Fills a byte array from the best available source. `crypto.getRandomValues`
 * works on plain http:// too, where `crypto.randomUUID` doesn't. `Math.random`
 * is the last-resort fallback for an environment with no Web Crypto at all.
 */
function randomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  const cryptoRef = globalThis.crypto;

  if (typeof cryptoRef?.getRandomValues === 'function') {
    return cryptoRef.getRandomValues(bytes);
  }

  for (let i = 0; i < count; i++) {
    bytes[i] = (Math.random() * 256) | 0;
  }
  return bytes;
}

/** Lowercase hex encoding, two characters per byte. */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a correlation identifier. Prefers `crypto.randomUUID`, falling
 * back to formatting random bytes as a v4 UUID.
 */
export function cpsUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1

  const hex = toHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-');
}

/**
 * Monotonic-ish millisecond clock for duration measurement.
 * `performance.now()` is preferred since it's immune to wall-clock
 * adjustments.
 */
export function cpsNow(): number {
  const perf = globalThis.performance;
  return typeof perf?.now === 'function' ? perf.now() : Date.now();
}

/**
 * Milliseconds since the *host* page loaded — prefers `top.performance.now()`
 * over the local realm's own, the same reasoning `cps-user-timings-internal.util.ts`
 * applies to marks/measures: in a composed page, a fragment runs in its own
 * same-origin iframe with a later `timeOrigin`, so a timeline position taken
 * from its own `performance` doesn't line up against the shell's. Reading
 * `top` always succeeds, even cross-origin; only touching a property on it
 * can throw, in which case this falls back to {@link cpsNow}.
 */
export function cpsElapsedNow(): number {
  try {
    const top = globalThis.top;
    if (typeof top?.performance?.now === 'function') {
      return top.performance.now();
    }
  } catch {
    // cross-origin, or sandboxed without `allow-same-origin`
  }
  return cpsNow();
}

/**
 * Converts an epoch timestamp into the `performance.now()` timeline.
 * Clamped to the current page's lifetime — a future timestamp, or one from
 * before the page loaded, yields `undefined`.
 */
export function cpsEpochToPerf(epochMs: number): number | undefined {
  if (!Number.isFinite(epochMs)) {
    return undefined;
  }

  const perf = globalThis.performance;
  if (typeof perf?.now !== 'function' || typeof perf.timeOrigin !== 'number') {
    return undefined;
  }

  const converted = epochMs - perf.timeOrigin;
  const now = perf.now();

  if (converted < 0 || converted > now) {
    return undefined;
  }

  return converted;
}
