import { isPlatformBrowser } from '@angular/common';
import { inject, isDevMode, PLATFORM_ID } from '@angular/core';

/**
 * A local copy of `@absaoss-cps/ngx-ui-watchtower`'s fail-open helpers —
 * `uwtSafe`/`uwtSafeVoid`/`uwtIsBrowser`/`uwtIsDevMode`.
 *
 * Not imported from the main entry point for the same reason as
 * `@absaoss-cps/ngx-ui-watchtower/rum`'s copy: ng-packagr fixes each entry point's `rootDir`
 * to its own `src`, and the main entry keeps these internal on purpose.
 * See `rum/src/lib/uwt-rum-internal.util`.
 */

/** Runs `fn`, returning `fallback` instead of ever throwing. */
export function uwtSafe<T>(operation: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    reportSuppressed(operation, error);
    return fallback;
  }
}

/** Void-returning form of {@link uwtSafe}. */
export function uwtSafeVoid(operation: string, fn: () => void): void {
  uwtSafe(operation, fn, undefined);
}

/** `isDevMode()` throws outside an Angular context; this never does. */
export function uwtIsDevMode(): boolean {
  try {
    return isDevMode();
  } catch {
    return false;
  }
}

/** Whether this runs in a browser. Needs an injection context. */
export function uwtIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

function reportSuppressed(operation: string, error: unknown): void {
  if (!uwtIsDevMode()) {
    return;
  }
  try {
    // eslint-disable-next-line no-console
    console.error(`[ngx-ui-watchtower] diagnostics.${operation} failed`, error);
  } catch {
    // A patched/throwing console must never escape suppression.
  }
}
