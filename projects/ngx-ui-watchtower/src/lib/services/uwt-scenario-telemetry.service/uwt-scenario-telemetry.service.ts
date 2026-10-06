import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  UWT_REDACT_CONFIG,
  UWT_TELEMETRY_IDENTITY
} from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { UWT_SCENARIO_TELEMETRY_CONFIG } from '../../config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
import type {
  UwtScenarioName,
  UwtScenarioOptions,
  UwtScenarioRecord
} from '../../models/uwt-scenario.models/uwt-scenario.models';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import {
  uwtDeepClone,
  uwtIsBrowser,
  uwtIsDevMode,
  uwtSafeVoid
} from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';
import { uwtRedactConfigFor } from '../../utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';
import { UwtScenario } from '../../scenario/uwt-scenario/uwt-scenario';
import { UwtTelemetryMonitor } from '../uwt-telemetry-monitor.service/uwt-telemetry-monitor.service';

/**
 * How many scenarios may be in flight before a development-mode warning
 * suggests a leak.
 *
 * Concurrent scenarios are legitimate — several journeys, tabs or panels
 * can run at once — so this is a smell threshold, not a limit: nothing is
 * dropped or rejected when it is crossed. Set well above any plausible
 * real concurrency, so crossing it might mean scenarios with `timeoutMs: 0` or
 * long lifecycles are being started and never settled.
 */
const ACTIVE_SCENARIO_WARN_THRESHOLD = 50;

/**
 * Creates and tracks scenarios — user journeys whose health this telemetry
 * layer measures.
 *
 * Each {@link start} call returns an independent {@link UwtScenario}; there is
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
export class UwtScenarioTelemetryService implements OnDestroy {
  private readonly identity = inject(UWT_TELEMETRY_IDENTITY);
  private readonly scenarioTelemetryConfig = inject(
    UWT_SCENARIO_TELEMETRY_CONFIG
  );

  private readonly redact = uwtRedactConfigFor(
    inject(UWT_REDACT_CONFIG),
    this.scenarioTelemetryConfig.redact
  );

  private readonly sink = inject(UwtTelemetrySink);
  private readonly monitor = inject(UwtTelemetryMonitor);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = uwtIsBrowser();
  private readonly zone = inject(NgZone, { optional: true });

  private readonly active = new Map<string, UwtScenario>();
  private readonly onPageHide = () => this.flushActive();
  private readonly onVisibilityChange = () => {
    if (this.document.visibilityState === 'hidden') {
      this.flushSink();
    }
  };

  private readonly _settled$ = new Subject<UwtScenarioRecord>();

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
  readonly settled$: Observable<UwtScenarioRecord> =
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
  start(options: UwtScenarioOptions): UwtScenario {
    const scenario = new UwtScenario(options, {
      identity: this.identity,
      scenarioTelemetryConfig: this.scenarioTelemetryConfig,
      redact: this.redact,
      sink: this.sink,
      monitor: this.monitor,
      runOutsideAngular: (callback) =>
        this.zone?.runOutsideAngular(callback) ?? callback(),
      onSettled: (scenarioId, record) => {
        this.active.delete(scenarioId);
        if (!this._settled$.observed) {
          return;
        }
        // Cloned so a settled$ subscriber can't mutate the same object
        // that's about to be (or already was) shipped to the sink.
        uwtSafeVoid('scenarioTelemetry.notify', () =>
          this._settled$.next(uwtDeepClone(record))
        );
      }
    });

    uwtSafeVoid('scenarioTelemetry.register', () => {
      this.active.set(scenario.id, scenario);
      if (uwtIsDevMode() && this.active.size > ACTIVE_SCENARIO_WARN_THRESHOLD) {
        console.warn(
          `[ngx-ui-watchtower] High number of active scenarios (${this.active.size}). Ensure scenarios with timeoutMs: 0 or long lifecycles are settled on destroy.`
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
  find(scenarioId: string): UwtScenario | undefined {
    return this.active.get(scenarioId);
  }

  /**
   * Every active scenario with the given name.
   *
   * `name` is a metric dimension, not a concurrency key - any number of
   * scenarios can legitimately share one (two tabs, two dashboard panels,
   * two independently-edited rows). Use this to inspect what's currently
   * running under a name and decide for yourself, e.g. before starting
   * another one.
   *
   * @param name the scenario name to match
   * @returns matching active scenarios, in start order
   */
  findByName(name: UwtScenarioName): UwtScenario[] {
    return this.getActive().filter((scenario) => scenario.name === name);
  }

  /**
   * Looks up an active scenario by id, asserting it has the expected name.
   *
   * The same lookup as {@link find}, with an extra check that its `name`
   * matches - a defensive assertion for a caller that already expects a
   * specific scenario name at this id, rather than a bare id lookup.
   *
   * @param name the expected scenario name
   * @param scenarioId the id to look up
   * @returns the scenario, or `undefined` if not active or its name
   *   doesn't match
   */
  findByNameAndId(
    name: UwtScenarioName,
    scenarioId: string
  ): UwtScenario | undefined {
    const scenario = this.find(scenarioId);
    return scenario?.name === name ? scenario : undefined;
  }

  /**
   * Every scenario currently in flight.
   *
   * @returns the active scenarios, in start order
   */
  getActive(): UwtScenario[] {
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
    uwtSafeVoid('scenarioTelemetry.flushSink', () => this.sink.flush(true));
  }

  /**
   * Settles every in-flight scenario as abandoned and asks the sink to send
   * what it holds using a transport that survives unload.
   *
   * Scenario emission is synchronous, so everything settled here reaches the
   * sink before the beacon goes out.
   */
  private flushActive(): void {
    uwtSafeVoid('scenarioTelemetry.flush', () => {
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
