import {
  UwtRegistered,
  UwtTelemetryAttribution,
  UwtTelemetryError,
  UwtTelemetryMetadata
} from '../uwt-telemetry-common.models/uwt-telemetry-common.models';

/**
 * Registry of this application's scenario names.
 *
 * Empty in the library. Augment it from your application, and every
 * `start({ name })` call is checked against it from then on.
 *
 * @example
 * ```typescript
 * // src/app/telemetry/scenarios.schema.ts
 * declare module '@absaoss-cps/ngx-ui-watchtower' {
 *   interface UwtScenarioNames {
 *     'route-navigation': true;
 *     'load-dashboard': true;
 *   }
 * }
 * export {};
 * ```
 *
 * @group Interfaces
 */
// Empty by design: the application fills it in. See the doc comment above.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UwtScenarioNames {}

/**
 * Registry of this application's step and aggregate names.
 *
 * Steps and aggregates share one vocabulary — a name declared for a step is
 * also valid passed to `aggregateStart`.
 *
 * @example
 * ```typescript
 * // src/app/telemetry/scenarios.schema.ts
 * declare module '@absaoss-cps/ngx-ui-watchtower' {
 *   interface UwtScenarioSteps {
 *     'resolve-route': true;
 *     'activate': true;
 *   }
 * }
 * export {};
 * ```
 *
 * @group Interfaces
 */
// Empty by design — see UwtScenarioNames above.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UwtScenarioSteps {}

/**
 * Every scenario name this application declares.
 *
 * Resolves to `string` until {@link UwtScenarioNames} is augmented.
 *
 * @group Types
 */
export type UwtScenarioName = UwtRegistered<UwtScenarioNames>;

/**
 * Every step and aggregate name this application declares.
 *
 * Resolves to `string` until {@link UwtScenarioSteps} is augmented.
 *
 * @group Types
 */
export type UwtStepName = UwtRegistered<UwtScenarioSteps>;

/**
 * Lifecycle state of a scenario.
 *
 * - `success` — the journey reached its goal.
 * - `failure` — a defect. Investigate.
 * - `abandoned` — the user navigated away or the page went away.
 *   `metadata.abandonedBy` (`'caller'` or `'page-hidden'`) says which.
 * - `incomplete` — an expected path that didn't reach the goal: no results,
 *   a declined guard, a feature flag routing elsewhere. Not an error.
 * - `timeout` — the scenario never settled within its deadline.
 *
 * There is no "in progress" status — {@link UwtScenario.status} is
 * `undefined` until it settles, and {@link UwtScenario.isSettled} is derived
 * from that. Settling an already-settled scenario is a no-op, never a throw.
 *
 * @group Types
 */
export type UwtScenarioStatus =
  'success' | 'failure' | 'abandoned' | 'incomplete' | 'timeout';

/**
 * Outcome of a single step — the same union as the scenario itself, since a
 * step still open when its scenario settles inherits that settlement.
 *
 * @group Types
 */
export type UwtScenarioStepStatus = UwtScenarioStatus;

/**
 * Detail accepted when closing a step.
 *
 * @group Interfaces
 */
export interface UwtScenarioStepDetail {
  /** Optional human-readable note. */
  message?: string;

  /**
   * Short, structured explanation, e.g. `'cache-hit'`, `'no-results'` — a
   * stable, low-cardinality value for grouping and filtering, independent
   * of `message`.
   */
  reason?: string;

  /** Attributes merged into the resulting record. */
  metadata?: UwtTelemetryMetadata;
}

/**
 * One measured phase within a scenario.
 *
 * Offsets are milliseconds relative to the scenario start rather than absolute
 * epochs — they stay small integers, which keeps the packed step array cheap to
 * serialize and read.
 *
 * @group Interfaces
 */
export interface UwtScenarioStep extends UwtScenarioStepDetail {
  /**
   * Step name, e.g. `fetch-data`. Declared in {@link UwtScenarioSteps} —
   * except the two boundary markers every scenario carries automatically,
   * `scenario-start` and `scenario-end`, which need no declaration because
   * the library writes them itself. See {@link UwtScenarioRecord.steps}.
   */
  name: UwtStepName | 'scenario-start' | 'scenario-end';

  /** Milliseconds from scenario start to step start. */
  startOffset: number;

  /** Milliseconds from scenario start to step end. Absent while open. */
  endOffset?: number;

  /** Step duration in milliseconds. Absent while open. */
  stepDelta?: number;

  /**
   * Milliseconds since the host page loaded (`performance.timeOrigin`), at
   * the moment this step closed — a timeline position, not a duration.
   * Consistent across a composed page's realms; see `uwtElapsedNow`.
   */
  elapsed?: number;

  /** Outcome. Absent while the step is still open. */
  status?: UwtScenarioStepStatus;

  /** Normalized error, when the step failed. */
  error?: UwtTelemetryError;
}

/**
 * Total time spent across repeated calls of one operation — a formatter
 * called per row, a validator called per field — where the total matters
 * more than a hundred individual steps.
 *
 * @group Interfaces
 */
export interface UwtScenarioAggregate {
  /** Operation name. Declared in {@link UwtScenarioSteps}. */
  name: UwtStepName;

  /** Summed duration across every completed call, in milliseconds. */
  elapsed: number;

  /** Number of completed calls contributing to `elapsed`. */
  callCount: number;
}

/**
 * Fields fixed at {@link UwtScenario.start} that identify the journey and
 * its place in a larger one, carried through onto the emitted
 * {@link UwtScenarioRecord}.
 *
 * @group Interfaces
 */
export interface UwtScenarioIdentityDetail {
  /** Product area, e.g. `customers`. */
  feature?: string;

  /** Operation discriminator within the feature, e.g. `export`. */
  operation?: string;

  /**
   * Route the journey started from, as a **template** — `/customers/:id`,
   * never a resolved `/customers/john@example.com`. Captured at `start()`,
   * so it reflects where the user began, not where a later navigation left
   * them. A resolved URL still has its query string stripped, but that's a
   * safety net, not a substitute — it would still split one metric
   * dimension into one series per customer.
   */
  route?: string;

  /**
   * Identifier of an enclosing scenario, for nested journeys. Enables
   * parent/child reconstruction in CloudWatch.
   */
  parentScenarioId?: string;
}

/**
 * Options accepted when starting a scenario.
 *
 * @group Interfaces
 */
export interface UwtScenarioOptions extends UwtScenarioIdentityDetail {
  /**
   * Stable scenario name, declared in {@link UwtScenarioNames}. A metric
   * dimension — never interpolate an id into it.
   */
  name: UwtScenarioName;

  /**
   * Milliseconds after which the scenario auto-settles as `timeout`. Defaults
   * to {@link UwtScenarioTelemetryConfig.defaultTimeoutMs}. Pass `0` to disable.
   */
  timeoutMs?: number;

  /**
   * Backdates the scenario start, in **epoch milliseconds** (`Date.now()`) —
   * useful when the journey begins before the code measuring it runs, e.g.
   * at a click rather than in the async handler it reaches. Clamped to the
   * page's lifetime; an out-of-range value is ignored.
   */
  startedAt?: number;

  /** Attributes applied to the scenario record and to every emitted event. */
  metadata?: UwtTelemetryMetadata;
}

/**
 * Detail accepted when settling a scenario.
 *
 * @group Interfaces
 */
export interface UwtScenarioOutcome extends UwtScenarioStepDetail {
  /**
   * Result code — an HTTP status, or a business error code. Kept separate from
   * `error` so it can serve as a low-cardinality metric dimension for
   * error-category distribution.
   */
  statusCode?: string | number;

  /** The thrown value, for {@link UwtScenario.fail}. Normalized before emission. */
  error?: unknown;
}

/**
 * The complete scenario payload emitted to the telemetry sink.
 *
 * Fields the AWS RUM client already attaches to every event — browser, OS,
 * device, page — stay absent to avoid duplicating the RUM envelope.
 * `application`, `sessionId` and `userId` are carried anyway, so a record
 * is self-describing without cross-referencing the envelope.
 *
 * @group Interfaces
 */
export interface UwtScenarioRecord
  extends
    Omit<UwtScenarioOutcome, 'error'>,
    UwtScenarioIdentityDetail,
    UwtTelemetryAttribution {
  /** Unique scenario identifier. Doubles as the correlation id. */
  scenarioId: string;

  /** Scenario name, from {@link UwtScenarioOptions.name}. */
  scenarioName: UwtScenarioName;

  /**
   * Lifecycle state at the moment of emission. `undefined` only for a
   * snapshot taken via {@link UwtScenario.toRecord} while still running.
   */
  status?: UwtScenarioStatus;

  /** Normalized error, when the scenario failed. */
  error?: UwtTelemetryError;

  /** ISO-8601 timestamp at scenario start. */
  startTime: string;

  /** ISO-8601 timestamp at settlement. Absent while in progress. */
  endTime?: string;

  /**
   * Total scenario duration in milliseconds — the headline latency measure.
   *
   * Named `delta`, not `elapsed`: this record's `elapsed` field means
   * something else — see below.
   */
  delta: number;

  /**
   * Milliseconds since the host page loaded (`performance.timeOrigin`), at
   * the moment this record was built — a timeline position, not a duration.
   * Consistent across a composed page's realms; see `uwtElapsedNow`. Not
   * exact for the RUM session itself, since the session cookie can survive a
   * reload that resets `performance.timeOrigin`.
   */
  elapsed: number;

  /** Number of steps the caller declared, including any dropped past `maxSteps`. */
  stepCount: number;

  /**
   * Every step, in the order they were opened. The library adds two
   * boundary markers — `scenario-start` and `scenario-end` — that bookend
   * the real steps and don't count toward `stepCount`/`maxSteps`. A
   * mid-flight {@link UwtScenario.toRecord} snapshot may hold only
   * `scenario-start`.
   */
  steps: UwtScenarioStep[];

  /**
   * Set when `stepCount` exceeded `maxSteps` and `steps` was truncated, so a
   * consumer need not know the configured limit to spot a partial list.
   */
  exceededStepsLimit?: boolean;

  /** Name of the last step closed before the scenario settled. */
  previousStep?: UwtStepName;

  /** Totals recorded via {@link UwtScenario.aggregateStart}. */
  aggregates?: UwtScenarioAggregate[];
}

/**
 * The per-step event, sent under `{namespace}.scenario.step` when
 * {@link UwtScenarioTelemetryConfig.emitLifecycleEvents} is on.
 *
 * One closed step, plus enough of its scenario's identity to stand alone —
 * the packed {@link UwtScenarioRecord} carries the same step inside `steps`.
 * The identity fields are the record's own, so the two can't drift apart.
 *
 * @group Interfaces
 */
export interface UwtScenarioStepEvent
  extends
    UwtScenarioStep,
    Pick<
      UwtScenarioRecord,
      'scenarioId' | 'scenarioName' | 'application' | 'sessionId' | 'userId'
    > {}
