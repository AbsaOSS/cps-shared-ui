import type { CpsBIEvent } from '../../models/cps-bi.models/cps-bi.models';
import type {
  CpsScenarioRecord,
  CpsScenarioStepEvent
} from '../../models/cps-scenario.models/cps-scenario.models';

/**
 * What a sink was handed, told apart by kind — the result of
 * {@link cpsClassifyTelemetryEvent}.
 *
 * `unknown` is an event type this library doesn't emit itself, such as a
 * `CpsBIEventDetail.eventType` override.
 *
 * @group Types
 */
export type CpsTelemetrySinkEvent =
  | { kind: 'scenario'; payload: CpsScenarioRecord }
  | { kind: 'scenario-step'; payload: CpsScenarioStepEvent }
  | { kind: 'bi'; payload: CpsBIEvent }
  | { kind: 'unknown'; payload: object };

/** Event-type endings, after the namespace. None ends with another, so order doesn't matter. */
const SCENARIO_STEP_SUFFIX = '.scenario.step';
const SCENARIO_SUFFIX = '.scenario';
const BI_SUFFIX = '.bi';

/**
 * Tells a sink what it received in {@link CpsTelemetrySink.record}: a
 * scenario record, a scenario step event, a BI event, or something else.
 *
 * Matched on the ending of the event type (`{ns}.scenario.step`,
 * `{ns}.scenario`, `{ns}.bi`), so it works whatever `eventNamespace` the
 * emitting realm configured — events forwarded from a fragment included.
 * Forwarded payloads are as the fragment's own library built them.
 *
 * @example
 * ```typescript
 * record(eventType: string, payload: object): void {
 *   const event = cpsClassifyTelemetryEvent(eventType, payload);
 *   switch (event.kind) {
 *     case 'scenario':
 *       this.exportScenario(event.payload); // a CpsScenarioRecord
 *       break;
 *     case 'bi':
 *       this.exportBusinessEvent(event.payload); // a CpsBIEvent
 *       break;
 *   }
 * }
 * ```
 *
 * @param eventType the event type the sink was given
 * @param payload the payload the sink was given
 * @returns the payload, tagged with its kind
 *
 * @group Utils
 */
export function cpsClassifyTelemetryEvent(
  eventType: string,
  payload: object
): CpsTelemetrySinkEvent {
  if (eventType.endsWith(SCENARIO_STEP_SUFFIX)) {
    return { kind: 'scenario-step', payload: payload as CpsScenarioStepEvent };
  }
  if (eventType.endsWith(SCENARIO_SUFFIX)) {
    return { kind: 'scenario', payload: payload as CpsScenarioRecord };
  }
  if (eventType.endsWith(BI_SUFFIX)) {
    return { kind: 'bi', payload: payload as CpsBIEvent };
  }
  return { kind: 'unknown', payload };
}
