import { isPlatformBrowser } from '@angular/common';
import { inject, isDevMode, PLATFORM_ID } from '@angular/core';

/**
 * A local copy of `cps-telemetry`'s own internal `cps-telemetry-safe.util.ts`
 * — `cpsSafe`/`cpsSafeVoid`/`cpsIsBrowser`/`cpsIsDevMode`/`cpsUuid`, verbatim.
 *
 * Not imported from the main entry point: ng-packagr fixes every entry
 * point's `rootDir` to its own `src` directory (unconditionally — see
 * `initializeTsConfig` in ng-packagr's own `tsconfig.js`), so a secondary
 * entry point cannot reach a file physically outside `rum/src` by relative
 * path. The main entry deliberately doesn't export these either — per
 * DESIGN.md §3, the fail-open wrappers and id generation stay internal so
 * they can change freely without a breaking release, and widening the
 * public API just to satisfy this entry point's own plumbing would trade
 * away that freedom for every consumer, not just this one. A small,
 * verbatim, unexported copy is the cheaper trade.
 */

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
