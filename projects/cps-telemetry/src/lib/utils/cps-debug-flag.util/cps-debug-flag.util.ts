import { cpsSafeVoid } from '../cps-telemetry-safe.util/cps-telemetry-safe.util';

/**
 * LocalStorage keys recognised as telemetry debug switches.
 *
 * @group Types
 */
export type CpsDebugFlag = 'debugLogger' | 'debugScenario' | 'debugBI';

const ENABLED_VALUES = new Set(['true', '1']);

/**
 * Reports whether a telemetry debug flag is enabled in LocalStorage.
 *
 * Only `'true'` and `'1'` enable it (case-insensitive, trimmed). Any other
 * non-empty value is treated as a comma-separated list of names, enabling the
 * flag only when `name` matches one of them; a call with no `name` reads a
 * list value as disabled. A missing key or a throwing `localStorage` also
 * reads as disabled.
 *
 * @param flag the LocalStorage key to check
 * @param name the name to test against a list value, when the flag is scoped
 * @returns `true` only when the flag is enabled for this name
 *
 * @group Utils
 */
export function cpsIsDebugEnabled(flag: CpsDebugFlag, name?: string): boolean {
  try {
    const raw = globalThis.localStorage?.getItem(flag);
    if (typeof raw !== 'string') {
      return false;
    }

    const value = raw.trim().toLowerCase();
    if (ENABLED_VALUES.has(value)) {
      return true;
    }

    if (name === undefined || !value) {
      return false;
    }

    return value
      .split(',')
      .some((entry) => entry.trim() === name.trim().toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Writes a debug line to the console, but only when `flag` is on, and
 * never at the caller's expense.
 *
 * The write is isolated in its own {@link cpsSafeVoid} rather than left to
 * whatever wrapper the caller already sits inside. That isolation is the
 * point: every caller prints a debug line immediately *before* handing the
 * same payload to a sink or transport, so a patched or broken `console`
 * must not be able to abort the send. Writing the line and shipping the
 * data are independent failures.
 *
 * @param flag the debug switch that has to be on
 * @param write performs the console call; never runs when the flag is off
 * @param name the name to test against a list-valued flag, e.g. a logger
 * name for `debugLogger`
 *
 * @group Utils
 */
export function cpsDebugWrite(
  flag: CpsDebugFlag,
  write: () => void,
  name?: string
): void {
  if (!cpsIsDebugEnabled(flag, name)) {
    return;
  }
  cpsSafeVoid(`${flag}.write`, write);
}
