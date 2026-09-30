import { isPlatformBrowser } from '@angular/common';
import { inject, isDevMode, PLATFORM_ID } from '@angular/core';

/**
 * A local copy of `cps-telemetry`'s fail-open helpers —
 * `cpsSafe`/`cpsSafeVoid`/`cpsIsBrowser`/`cpsIsDevMode`.
 *
 * Not imported from the main entry point for the same reason as
 * `cps-telemetry/rum`'s copy: ng-packagr fixes each entry point's `rootDir`
 * to its own `src`, and the main entry keeps these internal on purpose.
 * See `rum/src/lib/cps-rum-internal.util`.
 */

/** Runs `fn`, returning `fallback` instead of ever throwing. */
export function cpsSafe<T>(operation: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    reportSuppressed(operation, error);
    return fallback;
  }
}

/** Void-returning form of {@link cpsSafe}. */
export function cpsSafeVoid(operation: string, fn: () => void): void {
  cpsSafe(operation, fn, undefined);
}

/** `isDevMode()` throws outside an Angular context; this never does. */
export function cpsIsDevMode(): boolean {
  try {
    return isDevMode();
  } catch {
    return false;
  }
}

/** Whether this runs in a browser. Needs an injection context. */
export function cpsIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

function reportSuppressed(operation: string, error: unknown): void {
  if (!cpsIsDevMode()) {
    return;
  }
  try {
    // eslint-disable-next-line no-console
    console.error(`[cps-telemetry] diagnostics.${operation} failed`, error);
  } catch {
    // A patched/throwing console must never escape suppression.
  }
}
