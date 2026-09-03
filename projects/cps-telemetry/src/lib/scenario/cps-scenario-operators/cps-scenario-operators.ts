import { defer, MonoTypeOperatorFunction, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CpsScenarioOutcome } from '../../models/cps-scenario.models/cps-scenario.models';
import { CpsScenario } from '../cps-scenario/cps-scenario';
import { cpsSafe } from '../../utils/cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';

/**
 * Options for configuring scenario completion within an RxJS stream.
 *
 * @group Interfaces
 */
export interface CpsTraceScenarioOptions<T> {
  /**
   * Optional mapper that returns an outcome (metadata, statusCode, message)
   * based on the emitted value when the Observable completes successfully.
   */
  outcome?: (value: T) => CpsScenarioOutcome | void;
}

/**
 * An RxJS pipeable operator that automatically settles a {@link CpsScenario}
 * based on the stream's outcome: `complete()` on completion, `fail({ error })`
 * on error.
 *
 * @example
 * ```typescript
 * this.http.get<Customer[]>('/api/customers')
 *   .pipe(
 *     traceScenario(scenario, {
 *       outcome: (customers) => ({ metadata: { count: customers.length } })
 *     })
 *   )
 *   .subscribe();
 * ```
 *
 * @param scenario the scenario instance to track
 * @param options optional outcome mapper or configuration
 *
 * @group Utils
 */
export function traceScenario<T>(
  scenario: CpsScenario,
  options?:
    CpsTraceScenarioOptions<T> | ((value: T) => CpsScenarioOutcome | void)
): MonoTypeOperatorFunction<T> {
  const outcomeMapper =
    typeof options === 'function' ? options : options?.outcome;

  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      let lastValue: T | undefined;
      let hasValue = false;

      return source.pipe(
        tap({
          next: (value) => {
            lastValue = value;
            hasValue = true;
          },
          complete: () => {
            const outcome =
              hasValue && outcomeMapper
                ? cpsSafe(
                    'scenario.traceOutcome',
                    () => outcomeMapper(lastValue as T),
                    undefined
                  )
                : undefined;
            scenario.complete(outcome || undefined);
          },
          error: (error: unknown) => {
            scenario.fail({ error });
          },
          unsubscribe: () => {
            if (!scenario.isSettled) {
              scenario.cancel();
            }
          }
        })
      );
    });
}
