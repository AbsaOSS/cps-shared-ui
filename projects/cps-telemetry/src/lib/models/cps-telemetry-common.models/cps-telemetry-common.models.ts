/**
 * Attribute bag accepted by every telemetry API in this library.
 *
 * Flat and primitive-only — the type system alone keeps a response body, DOM
 * node, or populated user object out of telemetry. Matches what AWS RUM
 * accepts as event metadata, so nothing needs converting at the sink.
 *
 * @group Types
 */
export type CpsTelemetryMetadata = Record<
  string,
  string | number | boolean | null
>;

/**
 * Normalized, size-bounded representation of a thrown value.
 *
 * Produced by {@link cpsNormalizeError}. Raw `Error` objects (and HTTP
 * client errors, which can carry whole request/response bodies) are never
 * placed into a telemetry payload directly.
 *
 * @group Interfaces
 */
export interface CpsTelemetryError {
  /** Constructor name, e.g. `TypeError`, `HttpErrorResponse`. */
  name: string;

  /** Redacted, length-capped error message. */
  message: string;

  /** Length-capped stack trace. Omitted when stack capture is disabled. */
  stack?: string;
}

/**
 * The keys of a registry, or `string` while it is still empty — so an
 * application with no schema yet gets `string`, not `never`. Names are
 * unconstrained until the first augmentation, then checked against it.
 *
 * Shared by every closed-vocabulary name type in this library (scenario,
 * step and logger names).
 */
export type CpsRegistered<TRegistry> = keyof TRegistry extends never
  ? string
  : keyof TRegistry;

/**
 * Prefix used for event types when the application does not choose its own.
 *
 * @group Utils
 */
export const CPS_DEFAULT_EVENT_NAMESPACE = 'com.cps';

/**
 * The custom event types this library emits.
 *
 * Scenario and BI telemetry each use a single type carrying a `status` /
 * `eventName` field, rather than one type per event — one type means one
 * schema to query and one extended-metric definition in CloudWatch.
 *
 * @group Interfaces
 */
export interface CpsTelemetryEventTypes {
  /** A settled scenario, with its steps packed into the payload. */
  scenario: string;

  /** An individual scenario step. Only emitted in verbose mode. */
  scenarioStep: string;

  /** A business or UX event. */
  bi: string;
}

/**
 * Derives the event types for a namespace, so an application migrating onto
 * this library can keep its existing namespace.
 *
 * @param namespace the prefix, e.g. `com.my-app`
 * @returns the three event types under that namespace
 *
 * @group Utils
 */
export function cpsEventTypes(
  namespace: string = CPS_DEFAULT_EVENT_NAMESPACE
): CpsTelemetryEventTypes {
  const prefix = namespace || CPS_DEFAULT_EVENT_NAMESPACE;
  return {
    scenario: `${prefix}.scenario`,
    scenarioStep: `${prefix}.scenario.step`,
    bi: `${prefix}.bi`
  };
}

/**
 * The event types under the default namespace.
 *
 * @group Utils
 */
export const CPS_TELEMETRY_EVENT_TYPE = cpsEventTypes();
