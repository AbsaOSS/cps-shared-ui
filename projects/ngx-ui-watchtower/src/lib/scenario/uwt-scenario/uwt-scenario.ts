import { UwtTelemetryIdentity } from '../../config/uwt-telemetry-common.config/uwt-telemetry-common.config';
import { UwtScenarioTelemetryConfig } from '../../config/uwt-scenario-telemetry.config/uwt-scenario-telemetry.config';
import {
  UwtScenarioAggregate,
  UwtScenarioName,
  UwtScenarioOptions,
  UwtScenarioOutcome,
  UwtScenarioRecord,
  UwtScenarioStatus,
  UwtScenarioStep,
  UwtScenarioStepDetail,
  UwtScenarioStepEvent,
  UwtScenarioStepStatus,
  UwtStepName
} from '../../models/uwt-scenario.models/uwt-scenario.models';
import {
  uwtEventTypes,
  UwtTelemetryEventTypes,
  UwtTelemetryMetadata
} from '../../models/uwt-telemetry-common.models/uwt-telemetry-common.models';
import { UwtTelemetryMonitor } from '../../services/uwt-telemetry-monitor.service/uwt-telemetry-monitor.service';
import { UwtTelemetrySink } from '../../sinks/uwt-telemetry/uwt-telemetry-abstract.sink/uwt-telemetry-abstract.sink';
import {
  uwtDebugWrite,
  uwtIsDebugEnabled
} from '../../utils/uwt-debug-flag.util/uwt-debug-flag.util';
import {
  UwtRedactConfig,
  uwtMergeMetadata,
  uwtNormalizeError,
  uwtRedactMetadata,
  uwtScrubString
} from '../../utils/uwt-telemetry-redact.util/uwt-telemetry-redact.util';
import {
  uwtDeepClone,
  uwtElapsedNow,
  uwtEpochToPerf,
  uwtNow,
  uwtSafe,
  uwtSafeVoid,
  uwtUuid
} from '../../utils/uwt-telemetry-safe.util/uwt-telemetry-safe.util';
import {
  uwtClearMarks,
  uwtMark,
  uwtMarkName,
  uwtMeasure
} from '../../utils/uwt-user-timings-internal.util/uwt-user-timings-internal.util';

/**
 * Collaborators a scenario needs. Supplied by
 * {@link UwtScenarioTelemetryService}; not part of the public API.
 */
export interface UwtScenarioDeps {
  /** The application's identity, shared by every telemetry concern. */
  identity: UwtTelemetryIdentity;
  /** Scenario-specific tuning — timeouts, step cap, User Timing marks. */
  scenarioTelemetryConfig: UwtScenarioTelemetryConfig;
  /** Redaction settings, shared by every telemetry concern. */
  redact: UwtRedactConfig;
  sink: UwtTelemetrySink;
  /** Schedules timers outside Angular's zone when the host provides one. */
  runOutsideAngular?: <T>(callback: () => T) => T;
  /** Called once with the scenario's id when it reaches a terminal state. */
  onSettled: (scenarioId: string, record: UwtScenarioRecord) => void;
  /** Told about every event right after it is handed to the sink. */
  monitor: UwtTelemetryMonitor;
}

/** The two events a scenario sends: its settled record, and a closed step. */
type UwtScenarioEmission =
  | { kind: 'scenario'; payload: UwtScenarioRecord }
  | { kind: 'scenario-step'; payload: UwtScenarioStepEvent };

/** Boundary names used for User Timing marks (see `timingMark`). */
const START_MARK = 'start';
const SETTLE_MARK = 'settle';

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * A single in-flight user journey or feature execution.
 *
 * Each call to {@link UwtScenarioTelemetryService.start} returns a fresh
 * instance, so scenarios can run concurrently without interfering.
 *
 * @example
 * ```typescript
 * try {
 *   scenario.step('fetch-data');
 *   const rows = await this.api.fetchCustomers();
 *   scenario.complete({ metadata: { rowCount: rows.length } });
 * } catch (error) {
 *   scenario.fail({ error });
 * }
 * ```
 *
 * @group Classes
 */
export class UwtScenario {
  private readonly _id = uwtUuid();
  private readonly startedAt: number;
  private readonly _startTime: number;
  private readonly steps: UwtScenarioStep[] = [];
  private readonly metadata: UwtTelemetryMetadata;

  /** Running totals for {@link aggregateStart} / {@link aggregateEnd}. */
  private readonly aggregates = new Map<
    UwtStepName,
    { total: number; callCount: number; openedAt?: number }
  >();

  /** User Timing mark names created so far, cleared from the buffer at settle. */
  private readonly timingMarks: string[] = [];

  /** Event types for the application's configured namespace. */
  private readonly eventTypes: UwtTelemetryEventTypes;

  private _status?: UwtScenarioStatus;
  private _stepCount = 0;
  private openStep?: UwtScenarioStep;
  /** Whether the open step counted against {@link UwtScenarioTelemetryConfig.maxSteps}. */
  private openStepIncluded = false;
  private previousStep?: UwtStepName;
  private lastTimingMark: string;
  private timeoutHandle?: ReturnType<typeof setTimeout>;
  /** See {@link scheduleMarkCleanupFallback}. */
  private markCleanupTimer?: ReturnType<typeof setTimeout>;

  private _elapsed = 0;
  private settleOutcome?: UwtScenarioOutcome;
  private settleError?: unknown;
  /** Scrubbed once in {@link settle}, reused by {@link toRecord} — see that method's doc comment. */
  private settledMessage?: string;
  /** Scrubbed once in {@link settle}, reused by {@link toRecord} — see that method's doc comment. */
  private settledReason?: string;

  /**
   * Scrubbed once here and reused by {@link toRecord} and
   * {@link measureScenarioTiming}. `route` is expected to be a template
   * (`/customers/:id`); the library cannot enforce that.
   */
  private readonly feature?: string;
  private readonly operation?: string;
  private readonly route?: string;

  /**
   * Whether User Timing entries should be produced.
   *
   * The debug flag overrides the config, so a developer can
   * get timeline entries out of an already-deployed build.
   */
  private readonly userTimingsEnabled: boolean;

  constructor(
    private readonly options: UwtScenarioOptions,
    private readonly deps: UwtScenarioDeps
  ) {
    this.eventTypes = uwtEventTypes(deps.identity.eventNamespace);
    this.userTimingsEnabled =
      deps.scenarioTelemetryConfig.userTimings ||
      uwtIsDebugEnabled('debugScenario');
    this.metadata = uwtSafe(
      'scenario.construct',
      () => uwtRedactMetadata(options.metadata, deps.redact) ?? {},
      {}
    );
    this.feature = options.feature
      ? uwtScrubString(options.feature, deps.redact)
      : undefined;
    this.operation = options.operation
      ? uwtScrubString(options.operation, deps.redact)
      : undefined;
    this.route = options.route
      ? uwtScrubString(options.route, deps.redact)
      : undefined;

    const backdated =
      options.startedAt !== undefined
        ? uwtEpochToPerf(options.startedAt)
        : undefined;

    this.startedAt = backdated ?? uwtNow();
    this._startTime = Date.now() - Math.round(uwtNow() - this.startedAt);

    this.steps.push({
      name: 'scenario-start',
      startOffset: 0,
      endOffset: 0,
      stepDelta: 0,
      elapsed: Math.round(uwtElapsedNow()),
      status: 'success'
    });

    this.lastTimingMark = this.timingMark(START_MARK);
    this.scheduleTimeout();
  }

  /**
   * The scenario's unique identifier and correlation id — pass it to
   * {@link UwtLoggerService} calls, BI events, and backend requests to
   * reassemble a journey across frontend and backend telemetry.
   */
  get id(): string {
    return this._id;
  }

  /** The scenario name supplied at start. */
  get name(): UwtScenarioName {
    return this.options.name;
  }

  /**
   * The settled status, or `undefined` while the scenario is still running.
   *
   * Use {@link isSettled} to check whether it is done.
   */
  get status(): UwtScenarioStatus | undefined {
    return this._status;
  }

  /** Whether the scenario has settled. */
  get isSettled(): boolean {
    return this._status !== undefined;
  }

  /**
   * Duration in milliseconds — how long the scenario has run, or its final
   * duration once settled.
   *
   * Named `delta`, not `elapsed`: the record's `elapsed` field means
   * milliseconds since the page loaded, a different value.
   */
  get delta(): number {
    return this.isSettled ? this._elapsed : uwtNow() - this.startedAt;
  }

  /**
   * Opens a step, implicitly closing the previous one as completed.
   *
   * @param name the step name, declared in {@link UwtScenarioSteps}
   * @param metadata attributes recorded on the step
   * @returns this scenario, for chaining
   */
  step(name: UwtStepName, metadata?: UwtTelemetryMetadata): this {
    return this.mutate('step', () => {
      this.closeOpenStep('success');

      this._stepCount++;
      this.openStepIncluded =
        this._stepCount <= this.deps.scenarioTelemetryConfig.maxSteps;

      const step: UwtScenarioStep = {
        name,
        startOffset: Math.round(uwtNow() - this.startedAt),
        metadata: this.openStepIncluded
          ? uwtRedactMetadata(metadata, this.deps.redact)
          : undefined
      };

      this.openStep = step;
      if (this.openStepIncluded) {
        this.steps.push(step);
      }
    });
  }

  /**
   * Closes the open step as completed.
   *
   * Rarely needed — opening the next step or settling the scenario closes it
   * automatically. Use it when the step ends well before the next one starts.
   *
   * @param detail optional note and attributes
   * @returns this scenario, for chaining
   */
  endStep(detail?: UwtScenarioStepDetail): this {
    return this.mutate('endStep', () => this.closeOpenStep('success', detail));
  }

  /**
   * Closes the open step as failed, leaving the scenario itself in progress.
   *
   * Use when a step fails but the journey recovers — a retried request, an
   * optional resource that could not be loaded.
   *
   * @param error the thrown value
   * @param detail optional note and attributes
   * @returns this scenario, for chaining
   */
  failStep(error: unknown, detail?: UwtScenarioStepDetail): this {
    return this.mutate('failStep', () =>
      this.closeOpenStep('failure', detail, error)
    );
  }

  /**
   * Merges attributes into the scenario record while it is still running.
   *
   * Facts worth attaching to the whole journey — a row count, which strategy was
   * chosen, whether a cache was warm — are usually learned partway through,
   * after `start` and before any outcome is known.
   *
   * @param metadata attributes merged into the scenario record
   * @returns this scenario, for chaining
   */
  setData(metadata: UwtTelemetryMetadata): this {
    return this.mutate('setData', () => {
      const safe = uwtRedactMetadata(metadata, this.deps.redact);
      if (safe) {
        uwtMergeMetadata(this.metadata, safe, this.deps.redact);
      }
    });
  }

  /**
   * Starts timing one call of a repeatedly-invoked operation.
   *
   * Use for an operation that happens many times, where a step would bury
   * the scenario in noise. A second call for the same name before its
   * matching {@link aggregateEnd} is ignored.
   *
   * @param name the operation name, declared in {@link UwtScenarioSteps}
   * @returns this scenario, for chaining
   */
  aggregateStart(name: UwtStepName): this {
    return this.mutate('aggregateStart', () => {
      const entry = this.aggregates.get(name) ?? { total: 0, callCount: 0 };
      if (entry.openedAt === undefined) {
        entry.openedAt = uwtNow();
      }
      this.aggregates.set(name, entry);
    });
  }

  /**
   * Stops timing one call and adds it to the running total.
   *
   * Ignored when there is no matching {@link aggregateStart}, so an early return
   * inside the measured operation cannot corrupt the total.
   *
   * @param name the operation name, declared in {@link UwtScenarioSteps}
   * @returns this scenario, for chaining
   */
  aggregateEnd(name: UwtStepName): this {
    return this.mutate('aggregateEnd', () => {
      const entry = this.aggregates.get(name);
      if (!entry || entry.openedAt === undefined) {
        return;
      }

      entry.total += uwtNow() - entry.openedAt;
      entry.callCount++;
      entry.openedAt = undefined;
    });
  }

  /**
   * Settles the scenario successfully.
   *
   * @param outcome optional status code, note and attributes
   */
  complete(outcome?: UwtScenarioOutcome): void {
    this.settle('success', outcome);
  }

  /**
   * Settles the scenario as `incomplete` — it neither succeeded nor broke.
   *
   * For expected code paths that do not reach the goal. Kept apart from
   * `failed` and `cancelled` so it does not skew either.
   *
   * @param outcome optional status code, message, reason and attributes
   */
  incomplete(outcome?: UwtScenarioOutcome): void {
    this.settle('incomplete', outcome);
  }

  /**
   * Settles the scenario as failed.
   *
   * @param outcome optional status code, note, attributes, and the thrown
   *   `error` — normalized before emission
   */
  fail(outcome?: UwtScenarioOutcome): void {
    this.settle('failure', outcome, outcome?.error);
  }

  /**
   * Settles the scenario as abandoned — it stopped being relevant.
   *
   * Covers the user or page navigating away. A scenario that times out
   * settles as `timeout` instead, not `abandoned`.
   *
   * Records `metadata.abandonedBy: 'caller'`.
   *
   * @param outcome optional status code, message, reason and additional metadata
   */
  cancel(outcome?: UwtScenarioOutcome): void {
    this.settle('abandoned', {
      ...outcome,
      metadata: {
        ...outcome?.metadata,
        // Last, so caller-supplied metadata cannot override it.
        abandonedBy: 'caller'
      }
    });
  }

  /**
   * Builds the payload that is emitted to the sink.
   *
   * @returns the scenario record as it currently stands. A snapshot taken
   *   mid-flight can have fewer than two steps, since `scenario-end` is only
   *   written at settlement.
   */
  toRecord(): UwtScenarioRecord {
    const { redact } = this.deps;
    const settled = this.isSettled;

    const aggregates = this.collectAggregates();

    const record: UwtScenarioRecord = {
      scenarioId: this._id,
      parentScenarioId: this.options.parentScenarioId,
      scenarioName: this.options.name,
      feature: this.feature,
      operation: this.operation,
      route: this.route,
      status: this._status,
      startTime: new Date(this._startTime).toISOString(),
      endTime: settled
        ? new Date(this._startTime + Math.round(this._elapsed)).toISOString()
        : undefined,
      delta: Math.round(this.delta),
      elapsed: Math.round(uwtElapsedNow()),
      stepCount: this._stepCount,
      steps: uwtDeepClone(this.steps),
      previousStep: this.previousStep,
      aggregates: aggregates.length ? aggregates : undefined,
      metadata: Object.keys(this.metadata).length
        ? uwtDeepClone(this.metadata)
        : undefined,
      application: this.deps.identity.application,
      sessionId: this.sessionId(),
      userId: this.userId()
    };

    if (this._stepCount > this.deps.scenarioTelemetryConfig.maxSteps) {
      record.exceededStepsLimit = true;
    }

    if (this.settleOutcome?.statusCode !== undefined) {
      record.statusCode = this.settleOutcome.statusCode;
    }
    if (this.settledMessage) {
      record.message = this.settledMessage;
    }
    if (this.settledReason) {
      record.reason = this.settledReason;
    }
    if (this.settleError !== undefined) {
      record.error = uwtNormalizeError(this.settleError, redact);
    }

    return record;
  }

  /**
   * Settles the scenario into a status supplied as data.
   *
   * **Prefer {@link complete}, {@link fail}, {@link cancel} or
   * {@link incomplete}** — they name the outcome at the call site so it can
   * be found by searching. Use this form for adapters that map an external
   * status onto a scenario without knowing the outcome in advance.
   *
   * @param status the terminal state to settle into
   * @param outcome optional status code, note and attributes
   * @param error the thrown value, when settling as `failed`
   */
  settle(
    status: UwtScenarioStatus,
    outcome?: UwtScenarioOutcome,
    error?: unknown
  ): void {
    uwtSafeVoid(`scenario.${status}`, () => {
      if (this.isSettled) {
        return;
      }

      this.clearTimeout();
      this.clearMarkCleanupTimer();
      this._elapsed = uwtNow() - this.startedAt;
      this._status = status;

      const { message, reason } = outcome ?? {};
      const { redact } = this.deps;

      const resolvedMessage = message
        ? uwtScrubString(message, redact)
        : undefined;
      const resolvedReason = reason
        ? uwtScrubString(reason, redact)
        : undefined;
      const resolvedMetadata = uwtRedactMetadata(outcome?.metadata, redact);

      this.closeOpenStep(
        status,
        {
          message: resolvedMessage,
          reason: resolvedReason,
          metadata: resolvedMetadata
        },
        error,
        true
      );

      this.steps.push({
        name: 'scenario-end',
        startOffset: Math.round(this._elapsed),
        endOffset: Math.round(this._elapsed),
        stepDelta: 0,
        elapsed: Math.round(uwtElapsedNow()),
        status,
        ...(resolvedMessage && { message: resolvedMessage }),
        ...(resolvedReason && { reason: resolvedReason }),
        ...(resolvedMetadata && { metadata: resolvedMetadata }),
        ...(status === 'failure' &&
          error !== undefined && {
            error: uwtNormalizeError(error, redact)
          })
      });

      this.settleOutcome = outcome;
      this.settleError = error;
      this.settledMessage = resolvedMessage;
      this.settledReason = resolvedReason;

      if (resolvedMetadata) {
        uwtMergeMetadata(this.metadata, resolvedMetadata, redact);
      }

      this.measureScenarioTiming();

      const record = this.toRecord();
      this.deps.onSettled(this._id, record);
      this.emit(
        { kind: 'scenario', payload: record },
        `${status} in ${Math.round(this._elapsed)}ms`
      );
    });
  }

  /** The active telemetry sink's session id, when it has one. */
  private sessionId(): string | undefined {
    return uwtSafe(
      'scenario.getSessionId',
      () => this.deps.sink.getSessionId(),
      undefined
    );
  }

  /** The active telemetry sink's application user id, when one is signed in. */
  private userId(): string | undefined {
    return uwtSafe(
      'scenario.getUserId',
      () => this.deps.sink.getUserId(),
      undefined
    );
  }

  /** Snapshots the aggregate totals, closing any call still open. */
  private collectAggregates(): UwtScenarioAggregate[] {
    const result: UwtScenarioAggregate[] = [];
    const now = this.isSettled ? this.startedAt + this._elapsed : uwtNow();

    for (const [name, entry] of this.aggregates) {
      let total = entry.total;
      let callCount = entry.callCount;

      if (entry.openedAt !== undefined) {
        total += now - entry.openedAt;
        callCount++;
      }

      result.push({ name, elapsed: Math.round(total), callCount });
    }

    return result;
  }

  /**
   * @param alreadyRedacted `true` when `detail`'s fields are already
   *   scrubbed, so they are not redacted a second time. Defaults to `false`.
   */
  private closeOpenStep(
    status: UwtScenarioStepStatus,
    detail?: UwtScenarioStepDetail,
    error?: unknown,
    alreadyRedacted = false
  ): void {
    const step = this.openStep;
    if (!step) {
      return;
    }
    this.openStep = undefined;

    const { redact } = this.deps;
    step.endOffset = Math.round(uwtNow() - this.startedAt);
    step.stepDelta = step.endOffset - step.startOffset;
    step.elapsed = Math.round(uwtElapsedNow());
    step.status = status;

    if (detail?.message) {
      step.message = alreadyRedacted
        ? detail.message
        : uwtScrubString(detail.message, redact);
    }
    if (detail?.reason) {
      step.reason = alreadyRedacted
        ? detail.reason
        : uwtScrubString(detail.reason, redact);
    }
    if (detail?.metadata) {
      step.metadata = uwtMergeMetadata(
        step.metadata ?? {},
        alreadyRedacted
          ? detail.metadata
          : uwtRedactMetadata(detail.metadata, redact),
        redact
      );
    }
    if (status === 'failure' && error !== undefined) {
      step.error = uwtNormalizeError(error, redact);
    }

    // The two synthetic boundary markers never pass through here, so this
    // is always a real step name.
    const realStepName = step.name as UwtStepName;
    this.measureStepTiming(realStepName);
    this.previousStep = realStepName;

    if (
      this.deps.scenarioTelemetryConfig.emitLifecycleEvents &&
      this.openStepIncluded
    ) {
      const stepEvent: UwtScenarioStepEvent = {
        scenarioId: this._id,
        scenarioName: this.options.name,
        application: this.deps.identity.application,
        sessionId: this.sessionId(),
        userId: this.userId(),
        ...step
      };
      this.emit(
        { kind: 'scenario-step', payload: stepEvent },
        `step ${step.name}`
      );
    }
  }

  /**
   * Records a `performance.mark` for a boundary and remembers its name so
   * it can be cleared at settle.
   *
   * @param boundary the boundary name — `start`, a step name, or `settle`
   * @returns the mark name, for use as a measure endpoint
   */
  private timingMark(boundary: string): string {
    const name = uwtMarkName(
      this.deps.identity.application,
      this.options.name,
      this._id,
      boundary
    );

    if (this.userTimingsEnabled) {
      uwtMark(name);
      this.timingMarks.push(name);
    }

    return name;
  }

  /**
   * Records the DevTools timeline entry for a step that has just closed.
   *
   * Purely instrumentation — the step itself was already recorded by
   * {@link closeOpenStep}, which is what reaches the telemetry sink.
   */
  private measureStepTiming(stepName: UwtStepName): void {
    if (!this.userTimingsEnabled) {
      return;
    }

    const endMark = this.timingMark(stepName);
    uwtMeasure(
      `${this.options.name} [${stepName}]`,
      this.lastTimingMark,
      endMark
    );
    this.lastTimingMark = endMark;
  }

  /** Measures the whole scenario, then drops its marks from the buffer. */
  private measureScenarioTiming(): void {
    if (!this.userTimingsEnabled) {
      return;
    }

    const startMark = uwtMarkName(
      this.deps.identity.application,
      this.options.name,
      this._id,
      START_MARK
    );
    const endMark = this.timingMark(SETTLE_MARK);

    const feature = this.feature ? ` (${this.feature})` : '';
    uwtMeasure(`${this.options.name}${feature}`, startMark, endMark);

    uwtClearMarks(this.timingMarks);
    this.timingMarks.length = 0;
  }

  private scheduleTimeout(): void {
    const timeoutMs =
      this.options.timeoutMs ??
      this.deps.scenarioTelemetryConfig.defaultTimeoutMs;

    if (!timeoutMs || timeoutMs <= 0) {
      this.scheduleMarkCleanupFallback();
      return;
    }

    const remainingMs = Math.max(0, timeoutMs - (uwtNow() - this.startedAt));

    this.timeoutHandle = this.runOutsideAngular(() =>
      setTimeout(
        () => {
          this.timeoutHandle = undefined;
          if (remainingMs > MAX_TIMEOUT_MS) {
            this.scheduleTimeout();
            return;
          }
          this.settle('timeout', {
            message: `Scenario did not settle within ${timeoutMs}ms`
          });
        },
        Math.min(remainingMs, MAX_TIMEOUT_MS)
      )
    );
  }

  private clearTimeout(): void {
    this.timeoutHandle = UwtScenario.clearHandle(this.timeoutHandle);
  }

  /**
   * Defensive backstop for a scenario with no business timeout: clears its
   * User Timing marks after {@link UwtScenarioTelemetryConfig.markCleanupFallbackMs},
   * independent of whether the scenario ever settles.
   *
   * A no-op when `userTimings` is off or `markCleanupFallbackMs` is `0`.
   *
   * This clears marks only — it does not settle the scenario. A scenario
   * left unsettled this way never fires {@link UwtScenarioDeps.onSettled},
   * so it stays in {@link UwtScenarioTelemetryService}'s active registry for
   * the life of the page.
   */
  private scheduleMarkCleanupFallback(): void {
    const fallbackMs = this.deps.scenarioTelemetryConfig.markCleanupFallbackMs;
    if (!this.userTimingsEnabled || !fallbackMs || fallbackMs <= 0) {
      return;
    }

    this.markCleanupTimer = this.runOutsideAngular(() =>
      setTimeout(
        () => {
          this.markCleanupTimer = undefined;
          uwtClearMarks(this.timingMarks);
          this.timingMarks.length = 0;
        },
        Math.min(fallbackMs, MAX_TIMEOUT_MS)
      )
    );
  }

  private clearMarkCleanupTimer(): void {
    this.markCleanupTimer = UwtScenario.clearHandle(this.markCleanupTimer);
  }

  private runOutsideAngular<T>(callback: () => T): T {
    return this.deps.runOutsideAngular?.(callback) ?? callback();
  }

  /**
   * Clears a scheduled `setTimeout` if one is pending, otherwise a no-op.
   *
   * @param handle the timer handle, or `undefined` if nothing is scheduled
   * @returns `undefined`, so a call site can reassign its field directly:
   *   `this.timeoutHandle = UwtScenario.clearHandle(this.timeoutHandle)`
   */
  private static clearHandle(
    handle: ReturnType<typeof setTimeout> | undefined
  ): undefined {
    if (handle !== undefined) {
      clearTimeout(handle);
    }
    return undefined;
  }

  /**
   * Applies a mutation to a still-open scenario, and returns it for
   * chaining. Fail-open, and ignored once the scenario has settled.
   *
   * Settling methods do not use it — they end the scenario, not mutate it.
   *
   * @param operation the method name, for error reports
   * @param apply the mutation, run only while the scenario is open
   * @returns this scenario
   */
  private mutate(operation: string, apply: () => void): this {
    uwtSafeVoid(`scenario.${operation}`, () => {
      if (this.isSettled) {
        return;
      }
      apply();
    });
    return this;
  }

  /**
   * Sends a payload to the sink, first logging that exact same object if
   * `debugScenario` is on, then telling the monitor it was handed over.
   *
   * The only place any of the three happens, so console output, sink output
   * and what an observer sees can never drift apart: one object, one call
   * site.
   *
   * @param emission the payload and which of the two events it is
   * @param summary a short human-readable prefix for the console line
   */
  private emit(emission: UwtScenarioEmission, summary: string): void {
    const eventType =
      emission.kind === 'scenario'
        ? this.eventTypes.scenario
        : this.eventTypes.scenarioStep;

    uwtDebugWrite('debugScenario', () =>
      writeToConsole(summary, eventType, emission.payload)
    );
    this.deps.sink.record(eventType, emission.payload);
    this.deps.monitor.publish({
      ...emission,
      eventType,
      destination: 'sink',
      origin: { forwarded: false }
    });
  }
}

/**
 * Prints the payload exactly as the sink receives it.
 *
 * Prefixed with the application - in a composed page every realm writes to
 * the one console - then the concern and the scenario's name, the same
 * shape the logger and BI writers use.
 */
function writeToConsole(
  summary: string,
  eventType: string,
  payload: UwtScenarioEmission['payload']
): void {
  console.log(
    `[${payload.application}][scenario] ${payload.scenarioName} ${summary} -> ${eventType}`,
    payload
  );
}
