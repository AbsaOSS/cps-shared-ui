import type { CpsLogger } from '../../services/cps-logger.service/cps-logger.service';
import {
  CpsRegistered,
  CpsTelemetryError,
  CpsTelemetryMetadata
} from '../cps-telemetry-common.models/cps-telemetry-common.models';

/**
 * Registry of this application's scenario names.
 *
 * Empty in the library. Augment it from your application, and every
 * `start({ name })` call is checked against it from then on.
 *
 * @example
 * ```typescript
 * // src/app/telemetry/scenarios.schema.ts
 * declare module 'cps-telemetry' {
 *   interface CpsScenarioNames {
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
export interface CpsScenarioNames {}

/**
 * Registry of this application's step and aggregate names.
 *
 * Steps and aggregates share one vocabulary — a name declared for a step is
 * also valid passed to `aggregateStart`.
 *
 * @example
 * ```typescript
 * // src/app/telemetry/scenarios.schema.ts
 * declare module 'cps-telemetry' {
 *   interface CpsScenarioSteps {
 *     'resolve-route': true;
 *     'activate': true;
 *   }
 * }
 * export {};
 * ```
 *
 * @group Interfaces
 */
// Empty by design — see CpsScenarioNames above.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CpsScenarioSteps {}

/**
 * Every scenario name this application declares.
 *
 * Resolves to `string` until {@link CpsScenarioNames} is augmented.
 *
 * @group Types
 */
export type CpsScenarioName = CpsRegistered<CpsScenarioNames>;

/**
 * Every step and aggregate name this application declares.
 *
 * Resolves to `string` until {@link CpsScenarioSteps} is augmented.
 *
 * @group Types
 */
export type CpsStepName = CpsRegistered<CpsScenarioSteps>;

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
 * There is no "in progress" status — {@link CpsScenario.status} is
 * `undefined` until it settles, and {@link CpsScenario.isSettled} is derived
 * from that. Settling an already-settled scenario is a no-op, never a throw.
 *
 * @group Types
 */
export type CpsScenarioStatus =
  'success' | 'failure' | 'abandoned' | 'incomplete' | 'timeout';

/**
 * Outcome of a single step — the same union as the scenario itself, since a
 * step still open when its scenario settles inherits that settlement.
 *
 * @group Types
 */
export type CpsScenarioStepStatus = CpsScenarioStatus;

/**
 * Detail accepted when closing a step.
 *
 * @group Interfaces
 */
export interface CpsScenarioStepDetail {
  /** Optional human-readable note. */
  message?: string;

  /**
   * Short, structured explanation, e.g. `'cache-hit'`, `'no-results'` — a
   * stable, low-cardinality value for grouping and filtering, independent
   * of `message`.
   */
  reason?: string;

  /** Attributes merged into the resulting record. */
  metadata?: CpsTelemetryMetadata;
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
export interface CpsScenarioStep extends CpsScenarioStepDetail {
  /**
   * Step name, e.g. `fetch-data`. Declared in {@link CpsScenarioSteps} —
   * except the two boundary markers every scenario carries automatically,
   * `scenario-start` and `scenario-end`, which need no declaration because
   * the library writes them itself. See {@link CpsScenarioRecord.steps}.
   */
  name: CpsStepName | 'scenario-start' | 'scenario-end';

  /** Milliseconds from scenario start to step start. */
  startOffset: number;

  /** Milliseconds from scenario start to step end. Absent while open. */
  endOffset?: number;

  /** Step duration in milliseconds. Absent while open. */
  stepDelta?: number;

  /**
   * Milliseconds since this page loaded (`performance.timeOrigin`), at the
   * moment this step closed — a timeline position, not a duration.
   */
  elapsed?: number;

  /** Outcome. Absent while the step is still open. */
  status?: CpsScenarioStepStatus;

  /** Normalized error, when the step failed. */
  error?: CpsTelemetryError;
}

/**
 * Total time spent across repeated calls of one operation — a formatter
 * called per row, a validator called per field — where the total matters
 * more than a hundred individual steps.
 *
 * @group Interfaces
 */
export interface CpsScenarioAggregate {
  /** Operation name. Declared in {@link CpsScenarioSteps}. */
  name: CpsStepName;

  /** Summed duration across every completed call, in milliseconds. */
  elapsed: number;

  /** Number of completed calls contributing to `elapsed`. */
  callCount: number;
}

/**
 * Fields fixed at {@link CpsScenario.start} that identify the journey and
 * its place in a larger one, carried through onto the emitted
 * {@link CpsScenarioRecord}.
 *
 * @group Interfaces
 */
export interface CpsScenarioIdentityDetail {
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
export interface CpsScenarioOptions extends CpsScenarioIdentityDetail {
  /**
   * Stable scenario name, declared in {@link CpsScenarioNames}. A metric
   * dimension — never interpolate an id into it.
   */
  name: CpsScenarioName;

  /**
   * Milliseconds after which the scenario auto-settles as `timeout`. Defaults
   * to {@link CpsScenarioConfig.defaultTimeoutMs}. Pass `0` to disable.
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
  metadata?: CpsTelemetryMetadata;

  /**
   * Logger this scenario should bind its identity onto, exposed as
   * {@link CpsScenario.logger}. Optional — the scenario itself never logs
   * anything.
   */
  logger?: CpsLogger;
}

/**
 * Detail accepted when settling a scenario.
 *
 * @group Interfaces
 */
export interface CpsScenarioOutcome extends CpsScenarioStepDetail {
  /**
   * Result code — an HTTP status, or a business error code. Kept separate from
   * `error` so it can serve as a low-cardinality metric dimension for
   * error-category distribution.
   */
  statusCode?: string | number;

  /** The thrown value, for {@link CpsScenario.fail}. Normalized before emission. */
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
export interface CpsScenarioRecord
  extends Omit<CpsScenarioOutcome, 'error'>, CpsScenarioIdentityDetail {
  /** Unique scenario identifier. Doubles as the correlation id. */
  scenarioId: string;

  /** Scenario name, from {@link CpsScenarioOptions.name}. */
  scenarioName: CpsScenarioName;

  /**
   * Lifecycle state at the moment of emission. `undefined` only for a
   * snapshot taken via {@link CpsScenario.toRecord} while still running.
   */
  status?: CpsScenarioStatus;

  /** Normalized error, when the scenario failed. */
  error?: CpsTelemetryError;

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
   * Milliseconds since this page loaded (`performance.timeOrigin`), at the
   * moment this record was built — a timeline position, not a duration. Not
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
   * mid-flight {@link CpsScenario.toRecord} snapshot may hold only
   * `scenario-start`.
   */
  steps: CpsScenarioStep[];

  /**
   * Set when `stepCount` exceeded `maxSteps` and `steps` was truncated, so a
   * consumer need not know the configured limit to spot a partial list.
   */
  exceededStepsLimit?: boolean;

  /** Name of the last step closed before the scenario settled. */
  previousStep?: CpsStepName;

  /** Totals recorded via {@link CpsScenario.aggregateStart}. */
  aggregates?: CpsScenarioAggregate[];

  /** Application name, from {@link CpsTelemetryIdentity.application}. */
  application: string;

  /**
   * Session identifier from the active telemetry sink, when it has one.
   * `undefined` before the RUM client finishes initializing.
   */
  sessionId?: string;

  /**
   * Application user identifier, when one is signed in. Never an email,
   * username or account number — see {@link CpsTelemetrySink.setUserId}.
   */
  userId?: string;
}
