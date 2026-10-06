import {
  UwtRegistered,
  UwtTelemetryAttribution,
  UwtTelemetryMetadata
} from '../uwt-telemetry-common.models/uwt-telemetry-common.models';

/**
 * Registry of this application's business event names.
 *
 * An event name is a metric dimension: a typo does not produce a wrong
 * figure, it silently starts a second, incomplete series alongside the one
 * the dashboard reads. Declaring the vocabulary turns that into a compile
 * error.
 *
 * @example
 * ```typescript
 * // src/app/telemetry.schema.ts
 * declare module '@absaoss-cps/ngx-ui-watchtower' {
 *   interface UwtBIEventNames {
 *     export_clicked: true;
 *     theme_changed: true;
 *   }
 * }
 * export {};
 * ```
 *
 * @group Interfaces
 */
// Empty by design — see UwtScenarioNames in uwt-scenario.models.ts.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UwtBIEventNames {}

/**
 * Every business event name this application declares.
 *
 * Resolves to `string` until {@link UwtBIEventNames} is augmented.
 *
 * @group Types
 */
export type UwtBIEventName = UwtRegistered<UwtBIEventNames>;

/**
 * Correlation fields carried through unchanged onto the emitted
 * {@link UwtBIEvent} — shared by {@link UwtBIEventDetail} and
 * {@link UwtBIEvent} so neither declares its own copy.
 *
 * @group Interfaces
 */
export interface UwtBIEventCorrelation {
  /** Scenario this event happened inside. Pass {@link UwtScenario.id}. */
  scenarioId?: string;

  /** Product area, e.g. `customers`. Scrubbed the same as any other string value. */
  feature?: string;
}

/**
 * Optional correlation detail for a business/UX event.
 *
 * @group Interfaces
 */
export interface UwtBIEventDetail extends UwtBIEventCorrelation {
  /**
   * Overrides the RUM event type for this one event. BI events normally
   * share one type, with `eventName` as a field. Use this only when an
   * existing dashboard or metric filter needs a specific event type.
   */
  eventType?: string;
}

/**
 * A discrete business or UX event.
 *
 * Browser, device and page attributes come from the RUM envelope and aren't
 * repeated here — the client already stamps `pageId`/`pageUrl` on every
 * event, so a `route` field would just duplicate that. `application` is
 * carried anyway, for a self-describing record; see {@link UwtScenarioRecord}.
 *
 * @group Interfaces
 */
export interface UwtBIEvent
  extends UwtBIEventCorrelation, Pick<UwtTelemetryAttribution, 'application'> {
  /**
   * Event name, e.g. `export_clicked`. Declared by the application in
   * {@link UwtBIEventNames} — this library never hardcodes business event
   * names.
   */
  eventName: UwtBIEventName;

  /** ISO-8601 timestamp. */
  eventTime: string;

  /** Redacted structured attributes. */
  metadata?: UwtTelemetryMetadata;
}
