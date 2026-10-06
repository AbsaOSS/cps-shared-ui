import { UwtBIEvent } from '../uwt-bi.models/uwt-bi.models';
import { UwtLogRecord } from '../uwt-log.models/uwt-log.models';
import {
  UwtScenarioRecord,
  UwtScenarioStepEvent
} from '../uwt-scenario.models/uwt-scenario.models';
import { UwtTelemetryError } from '../uwt-telemetry-common.models/uwt-telemetry-common.models';

/**
 * Any JSON value — used where a payload's shape is not guaranteed, such as
 * an event forwarded from another realm.
 *
 * @group Types
 */
export type UwtJsonValue =
  | string
  | number
  | boolean
  | null
  | UwtJsonValue[]
  | { [key: string]: UwtJsonValue };

/**
 * A JSON object — see {@link UwtJsonValue}.
 *
 * @group Types
 */
export type UwtJsonObject = { [key: string]: UwtJsonValue };

/**
 * Where an observed event was handed: the telemetry sink, or the
 * application's log API provider.
 *
 * @group Types
 */
export type UwtTelemetryDestination = 'sink' | 'log-provider';

/**
 * Whether an observed event was produced in this realm, or forwarded from
 * another realm through {@link UwtTelemetryBroadcastHost}.
 *
 * @group Types
 */
export type UwtTelemetryEventOrigin =
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
export type UwtTelemetryEventKind =
  'bi' | 'scenario' | 'scenario-step' | 'log' | 'error' | 'unknown';

interface UwtTelemetryObservedBase {
  /** Increases by one per observed event, within one page load. */
  sequence: number;

  /** When the event was handed over, as ISO-8601. */
  capturedAt: string;

  destination: UwtTelemetryDestination;
  origin: UwtTelemetryEventOrigin;
}

/**
 * One event handed to a destination, as seen by
 * {@link UwtTelemetryMonitor}.
 *
 * Local payloads keep their library types. A forwarded payload arrived from
 * another realm and was only shape-checked there, so it is typed as plain
 * JSON — narrow on `origin.forwarded` before relying on its fields.
 *
 * @group Types
 */
export type UwtTelemetryObservedEvent =
  | (UwtTelemetryObservedBase & {
      kind: 'bi';
      eventType: string;
      payload: UwtBIEvent | UwtJsonObject;
    })
  | (UwtTelemetryObservedBase & {
      kind: 'scenario';
      eventType: string;
      payload: UwtScenarioRecord | UwtJsonObject;
    })
  | (UwtTelemetryObservedBase & {
      kind: 'scenario-step';
      eventType: string;
      payload: UwtScenarioStepEvent | UwtJsonObject;
    })
  | (UwtTelemetryObservedBase & {
      kind: 'log';
      payload: UwtLogRecord;
    })
  | (UwtTelemetryObservedBase & {
      kind: 'error';
      payload: UwtTelemetryError;
      /** The log event this error was mirrored from, when there is one. */
      relatedSequence?: number;
    })
  | (UwtTelemetryObservedBase & {
      kind: 'unknown';
      eventType: string;
      payload: UwtJsonObject;
    });

/** Distributes `Omit` over a union, so each member keeps its own fields. */
type UwtOmitEach<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * What a hand-off site passes to {@link UwtTelemetryMonitor.publish} — an
 * observed event without the fields the monitor assigns itself.
 */
export type UwtTelemetryPublishInput = UwtOmitEach<
  UwtTelemetryObservedEvent,
  'sequence' | 'capturedAt'
>;
