import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  CPS_REDACT_CONFIG,
  CPS_TELEMETRY_IDENTITY
} from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CPS_SCENARIO_CONFIG } from '../../config/cps-scenario.config/cps-scenario.config';
import {
  CpsScenarioOptions,
  CpsScenarioRecord
} from '../../models/cps-scenario.models/cps-scenario.models';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import {
  cpsDeepClone,
  cpsIsBrowser,
  cpsIsDevMode,
  cpsSafeVoid
} from '../../utils/cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';
import { cpsRedactConfigFor } from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import { CpsScenario } from '../../scenario/cps-scenario/cps-scenario';

/**
 * Creates and tracks scenarios — user journeys whose health this telemetry
 * layer measures.
 *
 * Each {@link start} call returns an independent {@link CpsScenario}; there is
 * no "current" scenario, so overlapping journeys are tracked separately.
 * Scenarios still in flight when the page unloads are settled as `abandoned`.
 *
 * @example
 * ```typescript
 * const scenario = scenarioTelemetry.start({ name: 'load-dashboard' });
 * try {
 *   scenario.step('fetch-widgets');
 *   const widgets = await this.api.widgets();
 *   scenario.complete({ metadata: { widgetCount: widgets.length } });
 * } catch (error) {
 *   scenario.fail({ error });
 * }
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsScenarioTelemetryService implements OnDestroy {
  private readonly identity = inject(CPS_TELEMETRY_IDENTITY);
  private readonly scenarioConfig = inject(CPS_SCENARIO_CONFIG);
  private readonly redact = cpsRedactConfigFor(
    inject(CPS_REDACT_CONFIG),
    this.scenarioConfig.redact
  );

  private readonly sink = inject(CpsTelemetrySink);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = cpsIsBrowser();

  private readonly active = new Map<string, CpsScenario>();
  private readonly onPageHide = () => this.flushActive();
  private readonly onVisibilityChange = () => {
    if (this.document.visibilityState === 'hidden') {
      this.flushSink();
    }
  };

  private readonly _settled$ = new Subject<CpsScenarioRecord>();

  /**
   * Emits every scenario record as it settles.
   *
   * Useful for reacting to outcomes without wrapping every call site — a
   * debug overlay, a retry prompt, a test harness asserting on journeys.
   *
   * @example
   * ```typescript
   * scenarioTelemetry.settled$
   *   .pipe(filter((r) => r.status === 'failure'))
   *   .subscribe((r) => this.notifications.warn(`${r.scenarioName} failed`));
   * ```
   */
  readonly settled$: Observable<CpsScenarioRecord> =
    this._settled$.asObservable();

  constructor() {
    if (this.isBrowser) {
      this.document.defaultView?.addEventListener('pagehide', this.onPageHide);

      this.document.addEventListener(
        'visibilitychange',
        this.onVisibilityChange
      );
    }
  }

  /**
   * Starts a new scenario.
   *
   * @param options the scenario name and optional classification, timeout and
   *   attributes
   * @returns an independent scenario instance
   */
  start(options: CpsScenarioOptions): CpsScenario {
    const scenario = new CpsScenario(options, {
      identity: this.identity,
      scenarioConfig: this.scenarioConfig,
      redact: this.redact,
      sink: this.sink,
      onSettled: (scenarioId, record) => {
        this.active.delete(scenarioId);
        if (!this._settled$.observed) {
          return;
        }
        // Cloned so a settled$ subscriber can't mutate the same object
        // that's about to be (or already was) shipped to the sink.
        cpsSafeVoid('scenarioTelemetry.notify', () =>
          this._settled$.next(cpsDeepClone(record))
        );
      }
    });

    cpsSafeVoid('scenarioTelemetry.register', () => {
      this.active.set(scenario.id, scenario);
      if (cpsIsDevMode() && this.active.size > 50) {
        // eslint-disable-next-line no-console
        console.warn(
          `[cps-telemetry] High number of active scenarios (${this.active.size}). Ensure scenarios with timeoutMs: 0 or long lifecycles are settled on destroy.`
        );
      }
    });

    return scenario;
  }

  /**
   * Looks up a scenario that has not yet settled.
   *
   * @param scenarioId the id to look up
   * @returns the scenario, or `undefined` if unknown or already settled
   */
  find(scenarioId: string): CpsScenario | undefined {
    return this.active.get(scenarioId);
  }

  /**
   * Every scenario currently in flight.
   *
   * @returns the active scenarios, in start order
   */
  getActive(): CpsScenario[] {
    return [...this.active.values()];
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.document.defaultView?.removeEventListener(
        'pagehide',
        this.onPageHide
      );
      this.document.removeEventListener(
        'visibilitychange',
        this.onVisibilityChange
      );
    }
    this.flushActive();
    this._settled$.complete();
  }

  /**
   * Dispatches what the sink holds, leaving running scenarios alone.
   *
   * Uses the beacon transport since the page may not survive a normal request.
   */
  private flushSink(): void {
    cpsSafeVoid('scenarioTelemetry.flushSink', () => this.sink.flush(true));
  }

  /**
   * Settles every in-flight scenario as abandoned and asks the sink to send
   * what it holds using a transport that survives unload.
   *
   * Scenario emission is synchronous, so everything settled here reaches the
   * sink before the beacon goes out.
   */
  private flushActive(): void {
    cpsSafeVoid('scenarioTelemetry.flush', () => {
      for (const scenario of this.getActive()) {
        scenario.settle('abandoned', {
          reason: 'page-hidden',
          metadata: { abandonedBy: 'page-hidden' }
        });
      }
      this.sink.flush(true);
    });
  }
}
