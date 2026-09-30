import { CpsBiEvent } from '../cps-bi.models/cps-bi.models';
import { CpsLogRecord } from '../cps-log.models/cps-log.models';
import {
  CpsScenarioRecord,
  CpsScenarioStepEvent
} from '../cps-scenario.models/cps-scenario.models';
import { CpsTelemetryError } from '../cps-telemetry-common.models/cps-telemetry-common.models';

/**
 * Any JSON value — used where a payload's shape is not guaranteed, such as
 * an event forwarded from another realm.
 *
 * @group Types
 */
export type CpsJsonValue =
  | string
  | number
  | boolean
  | null
  | CpsJsonValue[]
  | { [key: string]: CpsJsonValue };

/**
 * A JSON object — see {@link CpsJsonValue}.
 *
 * @group Types
 */
export type CpsJsonObject = { [key: string]: CpsJsonValue };

/**
 * Where an observed event was handed: the telemetry sink, or the
 * application's log API provider.
 *
 * @group Types
 */
export type CpsTelemetryDestination = 'sink' | 'log-provider';

/**
 * Whether an observed event was produced in this realm, or forwarded from
 * another realm through {@link CpsTelemetryBroadcastHost}.
 *
 * @group Types
 */
export type CpsTelemetryEventOrigin =
  { forwarded: false } | { forwarded: true; application?: string };

/**
 * What an observed event is.
 *
 * - `bi`, `scenario`, `scenario-step` — custom events sent to the sink.
 * - `log` — a record sent to the log API provider.
 * - `error` — an error sent to the sink, e.g. a log error mirrored to RUM.
 * - `unknown` — a forwarded event whose type this realm does not recognise.
 *
 * @group Types
 */
export type CpsTelemetryEventKind =
  'bi' | 'scenario' | 'scenario-step' | 'log' | 'error' | 'unknown';

interface CpsTelemetryObservedBase {
  /** Increases by one per observed event, within one page load. */
  sequence: number;

  /** When the event was handed over, as ISO-8601. */
  capturedAt: string;

  destination: CpsTelemetryDestination;
  origin: CpsTelemetryEventOrigin;
}

/**
 * One event handed to a destination, as seen by
 * {@link CpsTelemetryMonitor}.
 *
 * Local payloads keep their library types. A forwarded payload arrived from
 * another realm and was only shape-checked there, so it is typed as plain
 * JSON — narrow on `origin.forwarded` before relying on its fields.
 *
 * @group Types
 */
export type CpsTelemetryObservedEvent =
  | (CpsTelemetryObservedBase & {
      kind: 'bi';
      eventType: string;
      payload: CpsBiEvent | CpsJsonObject;
    })
  | (CpsTelemetryObservedBase & {
      kind: 'scenario';
      eventType: string;
      payload: CpsScenarioRecord | CpsJsonObject;
    })
  | (CpsTelemetryObservedBase & {
      kind: 'scenario-step';
      eventType: string;
      payload: CpsScenarioStepEvent | CpsJsonObject;
    })
  | (CpsTelemetryObservedBase & {
      kind: 'log';
      payload: CpsLogRecord;
    })
  | (CpsTelemetryObservedBase & {
      kind: 'error';
      payload: CpsTelemetryError;
      /** The log event this error was mirrored from, when there is one. */
      relatedSequence?: number;
    })
  | (CpsTelemetryObservedBase & {
      kind: 'unknown';
      eventType: string;
      payload: CpsJsonObject;
    });

/** Distributes `Omit` over a union, so each member keeps its own fields. */
type CpsOmitEach<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * What a hand-off site passes to {@link CpsTelemetryMonitor.publish} — an
 * observed event without the fields the monitor assigns itself.
 */
export type CpsTelemetryPublishInput = CpsOmitEach<
  CpsTelemetryObservedEvent,
  'sequence' | 'capturedAt'
>;
