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
