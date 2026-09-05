import { CpsTelemetryMetadata } from '../cps-telemetry-common.models/cps-telemetry-common.models';

/**
 * Correlation fields carried through unchanged onto the emitted
 * {@link CpsBiEvent} — shared by {@link CpsBiEventDetail} and
 * {@link CpsBiEvent} so neither declares its own copy.
 *
 * @group Interfaces
 */
export interface CpsBiEventCorrelation {
  /** Scenario this event happened inside. Pass {@link CpsScenario.id}. */
  scenarioId?: string;

  /** Product area, e.g. `customers`. Scrubbed the same as any other string value. */
  feature?: string;
}

/**
 * Optional correlation detail for a business/UX event.
 *
 * @group Interfaces
 */
export interface CpsBiEventDetail extends CpsBiEventCorrelation {
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
 * carried anyway, for a self-describing record; see {@link CpsScenarioRecord}.
 *
 * @group Interfaces
 */
export interface CpsBiEvent extends CpsBiEventCorrelation {
  /**
   * Event name, e.g. `export_clicked`. Supplied by the application — this
   * library never hardcodes business event names.
   */
  eventName: string;

  /** ISO-8601 timestamp. */
  eventTime: string;

  /** Redacted structured attributes. */
  metadata?: CpsTelemetryMetadata;

  /** Application name, from {@link CpsTelemetryIdentity.application}. */
  application: string;
}
