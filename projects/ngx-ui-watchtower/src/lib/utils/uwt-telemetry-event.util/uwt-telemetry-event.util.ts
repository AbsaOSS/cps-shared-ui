import type { UwtBIEvent } from '../../models/uwt-bi.models/uwt-bi.models';
import type {
  UwtScenarioRecord,
  UwtScenarioStepEvent
} from '../../models/uwt-scenario.models/uwt-scenario.models';

/**
 * What a sink was handed, told apart by kind — the result of
 * {@link uwtClassifyTelemetryEvent}.
 *
 * `unknown` is an event type this library doesn't emit itself, such as a
 * `UwtBIEventDetail.eventType` override.
 *
 * @group Types
 */
export type UwtTelemetrySinkEvent =
  | { kind: 'scenario'; payload: UwtScenarioRecord }
  | { kind: 'scenario-step'; payload: UwtScenarioStepEvent }
  | { kind: 'bi'; payload: UwtBIEvent }
  | { kind: 'unknown'; payload: object };

/** Event-type endings, after the namespace. None ends with another, so order doesn't matter. */
const SCENARIO_STEP_SUFFIX = '.scenario.step';
const SCENARIO_SUFFIX = '.scenario';
const BI_SUFFIX = '.bi';

/**
 * Tells a sink what it received in {@link UwtTelemetrySink.record}: a
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
 *   const event = uwtClassifyTelemetryEvent(eventType, payload);
 *   switch (event.kind) {
 *     case 'scenario':
 *       this.exportScenario(event.payload); // a UwtScenarioRecord
 *       break;
 *     case 'bi':
 *       this.exportBusinessEvent(event.payload); // a UwtBIEvent
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
export function uwtClassifyTelemetryEvent(
  eventType: string,
  payload: object
): UwtTelemetrySinkEvent {
  if (eventType.endsWith(SCENARIO_STEP_SUFFIX)) {
    return { kind: 'scenario-step', payload: payload as UwtScenarioStepEvent };
  }
  if (eventType.endsWith(SCENARIO_SUFFIX)) {
    return { kind: 'scenario', payload: payload as UwtScenarioRecord };
  }
  if (eventType.endsWith(BI_SUFFIX)) {
    return { kind: 'bi', payload: payload as UwtBIEvent };
  }
  return { kind: 'unknown', payload };
}
