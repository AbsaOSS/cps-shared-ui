/**
 * User Timing helpers, so scenarios show up in the browser's own performance
 * tooling, lined up against paint, layout, script and network on the
 * DevTools **Performance → Timings** track.
 *
 * Every function here feature-detects before touching the API — jsdom
 * implements `performance.now` but neither `mark` nor `measure`, and older
 * Safari lacks `measure` overloads too.
 */

interface UserTimingApi {
  mark(name: string): void;
  measure(name: string, start: string, end: string): void;
  clearMarks(name?: string): void;
  clearMeasures(name?: string): void;
}

/** Returns the User Timing API when the browser provides a usable one. */
function api(): UserTimingApi | undefined {
  const perf = hostPerformance();

  if (
    typeof perf?.mark !== 'function' ||
    typeof perf.measure !== 'function' ||
    typeof perf.clearMarks !== 'function' ||
    typeof perf.clearMeasures !== 'function'
  ) {
    return undefined;
  }

  return perf as UserTimingApi;
}

/**
 * The `performance` object marks and measures actually get written to.
 *
 * Prefers `top.performance` over the realm's own: in a composed page, a
 * fragment runs in its own same-origin iframe, and writing to its own
 * `performance` puts every entry on a timeline DevTools never has open.
 * Reading `top` always succeeds, even cross-origin; only touching a
 * property on it can throw, in which case this falls back to the realm's
 * own `performance`.
 */
function hostPerformance(): Partial<UserTimingApi> | undefined {
  try {
    const top = globalThis.top;
    if (top?.performance) {
      return top.performance as Partial<UserTimingApi>;
    }
  } catch {
    // cross-origin, or sandboxed without `allow-same-origin`
  }
  return globalThis.performance as Partial<UserTimingApi> | undefined;
}

/**
 * Builds the mark name for one scenario boundary. Includes the scenario id
 * so concurrent scenarios of the same name don't measure against each
 * other's marks, and the application's name so entries from different
 * fragments in a composed page stay distinguishable.
 */
export function cpsMarkName(
  application: string,
  scenarioName: string,
  scenarioId: string,
  step: string
): string {
  return `${application}:${scenarioName}:${step}:${scenarioId}`;
}

/** Records a mark, if the browser supports User Timing. */
export function cpsMark(name: string): void {
  try {
    api()?.mark(name);
  } catch {
    // never let instrumentation affect the caller
  }
}

/**
 * Records a measure between two marks and then drops the entry. `measure()`
 * emits its trace event at call time, so removing the entry afterwards
 * keeps the DevTools timeline intact while stopping the entry buffer from
 * growing without bound.
 *
 * Silently does nothing when either mark is missing.
 */
export function cpsMeasure(
  name: string,
  startMark: string,
  endMark: string
): void {
  const perf = api();
  if (!perf) {
    return;
  }

  try {
    perf.measure(name, startMark, endMark);
    perf.clearMeasures(name);
  } catch {
    // a referenced mark doesn't exist
  }
}

/**
 * Removes the given marks from the entry buffer. Called once a scenario
 * settles, so marks don't accumulate for the life of the page.
 */
export function cpsClearMarks(names: readonly string[]): void {
  const perf = api();
  if (!perf) {
    return;
  }

  for (const name of names) {
    try {
      perf.clearMarks(name);
    } catch {
      // entry already gone
    }
  }
}
