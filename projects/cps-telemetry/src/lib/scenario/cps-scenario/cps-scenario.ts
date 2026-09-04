import { CpsTelemetryIdentity } from '../../config/cps-telemetry-common.config/cps-telemetry-common.config';
import { CpsScenarioConfig } from '../../config/cps-scenario.config/cps-scenario.config';
import {
  CpsScenarioAggregate,
  CpsScenarioName,
  CpsScenarioOptions,
  CpsScenarioOutcome,
  CpsScenarioRecord,
  CpsScenarioStatus,
  CpsScenarioStep,
  CpsScenarioStepDetail,
  CpsScenarioStepStatus,
  CpsStepName
} from '../../models/cps-scenario.models/cps-scenario.models';
import {
  cpsEventTypes,
  CpsTelemetryEventTypes,
  CpsTelemetryMetadata
} from '../../models/cps-telemetry-common.models/cps-telemetry-common.models';
import type { CpsLogger } from '../../services/cps-logger.service/cps-logger.service';
import { CpsTelemetrySink } from '../../sinks/cps-telemetry/cps-telemetry-abstract.sink/cps-telemetry-abstract.sink';
import { cpsIsDebugEnabled } from '../../utils/cps-debug-flag.util/cps-debug-flag.util';
import {
  CpsRedactConfig,
  cpsMergeMetadata,
  cpsNormalizeError,
  cpsRedactMetadata,
  cpsScrubString
} from '../../utils/cps-telemetry-redact.util/cps-telemetry-redact.util';
import {
  cpsDeepClone,
  cpsElapsedNow,
  cpsEpochToPerf,
  cpsNow,
  cpsSafe,
  cpsSafeVoid,
  cpsUuid
} from '../../utils/cps-telemetry-safe-internal.util/cps-telemetry-safe-internal.util';
import {
  cpsClearMarks,
  cpsMark,
  cpsMarkName,
  cpsMeasure
} from '../../utils/cps-user-timings-internal.util/cps-user-timings-internal.util';

/**
 * Collaborators a scenario needs. Supplied by
 * {@link CpsScenarioTelemetryService}; not part of the public API.
 */
export interface CpsScenarioDeps {
  /** The application's identity, shared by every telemetry concern. */
  identity: CpsTelemetryIdentity;
  /** Scenario-specific tuning — timeouts, step cap, User Timing marks. */
  scenarioConfig: CpsScenarioConfig;
  /** Redaction settings, shared by every telemetry concern. */
  redact: CpsRedactConfig;
  sink: CpsTelemetrySink;
  /** Called once with the scenario's id when it reaches a terminal state. */
  onSettled: (scenarioId: string, record: CpsScenarioRecord) => void;
}

/** Boundary names used for User Timing marks (see `timingMark`). */
const START_MARK = 'start';
const SETTLE_MARK = 'settle';

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * A single in-flight user journey or feature execution.
 *
 * Each call to {@link CpsScenarioTelemetryService.start} returns a fresh
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
export class CpsScenario {
  private readonly _id = cpsUuid();
  private readonly startedAt: number;
  private readonly _startTime: number;
  private readonly steps: CpsScenarioStep[] = [];
  private readonly metadata: CpsTelemetryMetadata;

  /** Running totals for {@link aggregateStart} / {@link aggregateEnd}. */
  private readonly aggregates = new Map<
    CpsStepName,
    { total: number; callCount: number; openedAt?: number }
  >();

  /** User Timing mark names created so far, cleared from the buffer at settle. */
  private readonly timingMarks: string[] = [];

  /** Event types for the application's configured namespace. */
  private readonly eventTypes: CpsTelemetryEventTypes;

  private _status?: CpsScenarioStatus;
  private _stepCount = 0;
  private openStep?: CpsScenarioStep;
  /** Whether the open step counted against {@link CpsScenarioConfig.maxSteps}. */
  private openStepIncluded = false;
  private previousStep?: CpsStepName;
  private lastTimingMark: string;
  private timeoutHandle?: ReturnType<typeof setTimeout>;
  /** See {@link scheduleMarkCleanupFallback}. */
  private markCleanupTimer?: ReturnType<typeof setTimeout>;

  private _elapsed = 0;
  private _logger?: CpsLogger;
  private settleOutcome?: CpsScenarioOutcome;
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
    private readonly options: CpsScenarioOptions,
    private readonly deps: CpsScenarioDeps
  ) {
    this.eventTypes = cpsEventTypes(deps.identity.eventNamespace);
    this.userTimingsEnabled =
      deps.scenarioConfig.userTimings || cpsIsDebugEnabled('debugScenario');
    this.metadata = cpsSafe(
      'scenario.construct',
      () => cpsRedactMetadata(options.metadata, deps.redact) ?? {},
      {}
    );
    this.feature = options.feature
      ? cpsScrubString(options.feature, deps.redact)
      : undefined;
    this.operation = options.operation
      ? cpsScrubString(options.operation, deps.redact)
      : undefined;
    this.route = options.route
      ? cpsScrubString(options.route, deps.redact)
      : undefined;

    const backdated =
      options.startedAt !== undefined
        ? cpsEpochToPerf(options.startedAt)
        : undefined;

    this.startedAt = backdated ?? cpsNow();
    this._startTime = Date.now() - Math.round(cpsNow() - this.startedAt);

    this.steps.push({
      name: 'scenario-start',
      startOffset: 0,
      endOffset: 0,
      stepDelta: 0,
      elapsed: Math.round(cpsElapsedNow()),
      status: 'success'
    });

    this.lastTimingMark = this.timingMark(START_MARK);
    this.scheduleTimeout();
    this.debug('started');
  }

  /**
   * The scenario's unique identifier and correlation id — pass it to
   * {@link CpsLoggerService} calls, BI events, and backend requests to
   * reassemble a journey across frontend and backend telemetry.
   */
  get id(): string {
    return this._id;
  }

  /** The scenario name supplied at start. */
  get name(): CpsScenarioName {
    return this.options.name;
  }

  /**
   * The settled status, or `undefined` while the scenario is still running.
   *
   * Use {@link isSettled} to check whether it is done.
   */
  get status(): CpsScenarioStatus | undefined {
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
    return this.isSettled ? this._elapsed : cpsNow() - this.startedAt;
  }

  /**
   * The logger passed to {@link CpsScenarioTelemetryService.start}, with this
   * scenario's id bound as the correlation id.
   *
   * `undefined` unless a logger was supplied.
   */
  get logger(): CpsLogger | undefined {
    if (!this._logger && this.options.logger) {
      this._logger = cpsSafe(
        'scenario.logger',
        () =>
          this.options.logger?.child({
            context: this.options.name,
            correlationId: this._id
          }),
        undefined
      );
    }
    return this._logger;
  }

  /**
   * Opens a step, implicitly closing the previous one as completed.
   *
   * @param name the step name, declared in {@link CpsScenarioSteps}
   * @param metadata attributes recorded on the step
   * @returns this scenario, for chaining
   */
  step(name: CpsStepName, metadata?: CpsTelemetryMetadata): this {
    return this.mutate('step', () => {
      this.closeOpenStep('success');

      const step: CpsScenarioStep = {
        name,
        startOffset: Math.round(cpsNow() - this.startedAt),
        metadata: cpsRedactMetadata(metadata, this.deps.redact)
      };

      this.openStep = step;
      this._stepCount++;

      this.openStepIncluded =
        this._stepCount <= this.deps.scenarioConfig.maxSteps;
      if (this.openStepIncluded) {
        this.steps.push(step);
      }

      this.debug(`step ${name}`);
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
  endStep(detail?: CpsScenarioStepDetail): this {
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
  failStep(error: unknown, detail?: CpsScenarioStepDetail): this {
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
  setData(metadata: CpsTelemetryMetadata): this {
    return this.mutate('setData', () => {
      const safe = cpsRedactMetadata(metadata, this.deps.redact);
      if (safe) {
        cpsMergeMetadata(this.metadata, safe, this.deps.redact);
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
   * @param name the operation name, declared in {@link CpsScenarioSteps}
   * @returns this scenario, for chaining
   */
  aggregateStart(name: CpsStepName): this {
    return this.mutate('aggregateStart', () => {
      const entry = this.aggregates.get(name) ?? { total: 0, callCount: 0 };
      if (entry.openedAt === undefined) {
        entry.openedAt = cpsNow();
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
   * @param name the operation name, declared in {@link CpsScenarioSteps}
   * @returns this scenario, for chaining
   */
  aggregateEnd(name: CpsStepName): this {
    return this.mutate('aggregateEnd', () => {
      const entry = this.aggregates.get(name);
      if (!entry || entry.openedAt === undefined) {
        return;
      }

      entry.total += cpsNow() - entry.openedAt;
      entry.callCount++;
      entry.openedAt = undefined;
    });
  }

  /**
   * Settles the scenario successfully.
   *
   * @param outcome optional status code, note and attributes
   */
  complete(outcome?: CpsScenarioOutcome): void {
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
  incomplete(outcome?: CpsScenarioOutcome): void {
    this.settle('incomplete', outcome);
  }

  /**
   * Settles the scenario as failed.
   *
   * @param outcome optional status code, note, attributes, and the thrown
   *   `error` — normalized before emission
   */
  fail(outcome?: CpsScenarioOutcome): void {
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
  cancel(outcome?: CpsScenarioOutcome): void {
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
  toRecord(): CpsScenarioRecord {
    const { redact } = this.deps;
    const settled = this.isSettled;

    const aggregates = this.collectAggregates();

    const record: CpsScenarioRecord = {
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
      elapsed: Math.round(cpsElapsedNow()),
      stepCount: this._stepCount,
      steps: cpsDeepClone(this.steps),
      previousStep: this.previousStep,
      aggregates: aggregates.length ? aggregates : undefined,
      metadata: Object.keys(this.metadata).length
        ? cpsDeepClone(this.metadata)
        : undefined,
      application: this.deps.identity.application,
      sessionId: this.sessionId(),
      userId: this.userId()
    };

    if (this._stepCount > this.deps.scenarioConfig.maxSteps) {
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
      record.error = cpsNormalizeError(this.settleError, redact);
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
    status: CpsScenarioStatus,
    outcome?: CpsScenarioOutcome,
    error?: unknown
  ): void {
    cpsSafeVoid(`scenario.${status}`, () => {
      if (this.guardSettled(status)) {
        return;
      }

      this.clearTimeout();
      this.clearMarkCleanupTimer();
      this._elapsed = cpsNow() - this.startedAt;
      this._status = status;

      const { message, reason } = outcome ?? {};
      const { redact } = this.deps;

      const resolvedMessage = message
        ? cpsScrubString(message, redact)
        : undefined;
      const resolvedReason = reason
        ? cpsScrubString(reason, redact)
        : undefined;
      const resolvedMetadata = cpsRedactMetadata(outcome?.metadata, redact);

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
        elapsed: Math.round(cpsElapsedNow()),
        status,
        ...(resolvedMessage && { message: resolvedMessage }),
        ...(resolvedReason && { reason: resolvedReason }),
        ...(resolvedMetadata && { metadata: resolvedMetadata }),
        ...(status === 'failure' &&
          error !== undefined && {
            error: cpsNormalizeError(error, redact)
          })
      });

      this.settleOutcome = outcome;
      this.settleError = error;
      this.settledMessage = resolvedMessage;
      this.settledReason = resolvedReason;

      if (resolvedMetadata) {
        cpsMergeMetadata(this.metadata, resolvedMetadata, redact);
      }

      this.measureScenarioTiming();

      const record = this.toRecord();
      this.debugEmit(
        this.eventTypes.scenario,
        record,
        `${status} in ${Math.round(this._elapsed)}ms`
      );
      this.deps.onSettled(this._id, record);
      this.emitScenarioEvent(record);
    });
  }

  /** The active telemetry sink's session id, when it has one. */
  private sessionId(): string | undefined {
    return cpsSafe(
      'scenario.getSessionId',
      () => this.deps.sink.getSessionId(),
      undefined
    );
  }

  /** The active telemetry sink's application user id, when one is signed in. */
  private userId(): string | undefined {
    return cpsSafe(
      'scenario.getUserId',
      () => this.deps.sink.getUserId(),
      undefined
    );
  }

  /** Emits the settled record. */
  private emitScenarioEvent(record: CpsScenarioRecord): void {
    this.deps.sink.record(
      this.eventTypes.scenario,
      record as unknown as object
    );
  }

  /** Snapshots the aggregate totals, closing any call still open. */
  private collectAggregates(): CpsScenarioAggregate[] {
    const result: CpsScenarioAggregate[] = [];
    const now = this.isSettled ? this.startedAt + this._elapsed : cpsNow();

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
    status: CpsScenarioStepStatus,
    detail?: CpsScenarioStepDetail,
    error?: unknown,
    alreadyRedacted = false
  ): void {
    const step = this.openStep;
    if (!step) {
      return;
    }
    this.openStep = undefined;

    const { redact } = this.deps;
    step.endOffset = Math.round(cpsNow() - this.startedAt);
    step.stepDelta = step.endOffset - step.startOffset;
    step.elapsed = Math.round(cpsElapsedNow());
    step.status = status;

    if (detail?.message) {
      step.message = alreadyRedacted
        ? detail.message
        : cpsScrubString(detail.message, redact);
    }
    if (detail?.reason) {
      step.reason = alreadyRedacted
        ? detail.reason
        : cpsScrubString(detail.reason, redact);
    }
    if (detail?.metadata) {
      step.metadata = cpsMergeMetadata(
        step.metadata ?? {},
        alreadyRedacted
          ? detail.metadata
          : cpsRedactMetadata(detail.metadata, redact),
        redact
      );
    }
    if (status === 'failure' && error !== undefined) {
      step.error = cpsNormalizeError(error, redact);
    }

    // The two synthetic boundary markers never pass through here, so this
    // is always a real step name.
    const realStepName = step.name as CpsStepName;
    this.measureStepTiming(realStepName);
    this.previousStep = realStepName;

    if (this.deps.scenarioConfig.emitLifecycleEvents && this.openStepIncluded) {
      const stepEvent = {
        scenarioId: this._id,
        scenarioName: this.options.name,
        application: this.deps.identity.application,
        sessionId: this.sessionId(),
        userId: this.userId(),
        ...step
      };
      this.debugEmit(
        this.eventTypes.scenarioStep,
        stepEvent,
        `step ${step.name}`
      );
      this.deps.sink.record(this.eventTypes.scenarioStep, stepEvent);
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
    const name = cpsMarkName(
      this.deps.identity.application,
      this.options.name,
      this._id,
      boundary
    );

    if (this.userTimingsEnabled) {
      cpsMark(name);
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
  private measureStepTiming(stepName: CpsStepName): void {
    if (!this.userTimingsEnabled) {
      return;
    }

    const endMark = this.timingMark(stepName);
    cpsMeasure(
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

    const startMark = cpsMarkName(
      this.deps.identity.application,
      this.options.name,
      this._id,
      START_MARK
    );
    const endMark = this.timingMark(SETTLE_MARK);

    const feature = this.feature ? ` (${this.feature})` : '';
    cpsMeasure(`${this.options.name}${feature}`, startMark, endMark);

    cpsClearMarks(this.timingMarks);
    this.timingMarks.length = 0;
  }

  private scheduleTimeout(): void {
    const timeoutMs =
      this.options.timeoutMs ?? this.deps.scenarioConfig.defaultTimeoutMs;

    if (!timeoutMs || timeoutMs <= 0) {
      this.scheduleMarkCleanupFallback();
      return;
    }

    const remainingMs = Math.max(0, timeoutMs - (cpsNow() - this.startedAt));

    this.timeoutHandle = setTimeout(
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
    );
  }

  private clearTimeout(): void {
    this.timeoutHandle = CpsScenario.clearHandle(this.timeoutHandle);
  }

  /**
   * Defensive backstop for a scenario with no business timeout: clears its
   * User Timing marks after {@link CpsScenarioConfig.markCleanupFallbackMs},
   * independent of whether the scenario ever settles.
   *
   * A no-op when `userTimings` is off or `markCleanupFallbackMs` is `0`.
   *
   * This clears marks only — it does not settle the scenario. A scenario
   * left unsettled this way never fires {@link CpsScenarioDeps.onSettled},
   * so it stays in {@link CpsScenarioTelemetryService}'s active registry for
   * the life of the page.
   */
  private scheduleMarkCleanupFallback(): void {
    const fallbackMs = this.deps.scenarioConfig.markCleanupFallbackMs;
    if (!this.userTimingsEnabled || !fallbackMs || fallbackMs <= 0) {
      return;
    }

    this.markCleanupTimer = setTimeout(
      () => {
        this.markCleanupTimer = undefined;
        cpsClearMarks(this.timingMarks);
        this.timingMarks.length = 0;
      },
      Math.min(fallbackMs, MAX_TIMEOUT_MS)
    );
  }

  private clearMarkCleanupTimer(): void {
    this.markCleanupTimer = CpsScenario.clearHandle(this.markCleanupTimer);
  }

  /**
   * Clears a scheduled `setTimeout` if one is pending, otherwise a no-op.
   *
   * @param handle the timer handle, or `undefined` if nothing is scheduled
   * @returns `undefined`, so a call site can reassign its field directly:
   *   `this.timeoutHandle = CpsScenario.clearHandle(this.timeoutHandle)`
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
   * @param operation the method name, for debug output and error reports
   * @param apply the mutation, run only while the scenario is open
   * @returns this scenario
   */
  private mutate(operation: string, apply: () => void): this {
    cpsSafeVoid(`scenario.${operation}`, () => {
      if (this.guardSettled(operation)) {
        return;
      }
      apply();
    });
    return this;
  }

  /**
   * Returns `true` when the operation should be skipped because the
   * scenario has already settled.
   */
  private guardSettled(operation: string): boolean {
    if (!this.isSettled) {
      return false;
    }
    this.debug(`ignored ${operation} — already ${this._status}`);
    return true;
  }

  /**
   * Logs the exact payload handed to the sink, with the event type it is
   * sent under.
   *
   * @param eventType the type the payload is recorded under
   * @param payload the object passed to {@link CpsTelemetrySink.record}
   * @param summary a short human-readable prefix
   */
  private debugEmit(eventType: string, payload: object, summary: string): void {
    this.logIfDebugging(() =>
      // eslint-disable-next-line no-console
      console.log(
        `[cps][scenario] ${this.options.name} ${summary} -> ${eventType}`,
        payload
      )
    );
  }

  /** Progress trace for things that are never sent anywhere. */
  private debug(message: string): void {
    this.logIfDebugging(() =>
      // eslint-disable-next-line no-console
      console.log(
        `[cps][scenario] ${this.options.name} ${message}`,
        this.debugSnapshot()
      )
    );
  }

  /**
   * The object attached to a {@link debug} line — enough to follow what a
   * scenario is doing and to tell concurrent scenarios of the same name
   * apart.
   */
  private debugSnapshot(): Record<string, unknown> {
    return {
      scenarioId: this._id,
      stepCount: this._stepCount,
      previousStep: this.previousStep,
      delta: Math.round(this.delta)
    };
  }

  /**
   * Shared guard and fail-open wrapper for {@link debug} and {@link
   * debugEmit} — both gate on the same flag and must not let a broken
   * console take the caller down.
   */
  private logIfDebugging(log: () => void): void {
    if (!cpsIsDebugEnabled('debugScenario')) {
      return;
    }
    cpsSafeVoid('scenario.debug', log);
  }
}
