import { InjectionToken } from '@angular/core';
import { UwtTelemetryObservedEvent } from '@absaoss-cps/ngx-ui-watchtower';

/**
 * The three sections of the diagnostics popup.
 *
 * @group Types
 */
export type UwtDiagnosticsSectionId = 'bi' | 'scenario' | 'logging';

/**
 * A key combination that opens the diagnostics popup.
 *
 * Matched on `KeyboardEvent.code` — the physical key — so it works on every
 * keyboard layout, and isn't affected by what Option or Shift produce.
 * A modifier left out must be *up*, so extra modifiers never match.
 *
 * @group Interfaces
 */
export interface UwtDiagnosticsShortcut {
  /** `KeyboardEvent.code`, e.g. `'Digit8'` or `'KeyD'`. */
  code: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;

  /** How the shortcut is written for people, e.g. `'⇧⌥⌘8'`. */
  label?: string;
}

/**
 * Configuration for {@link provideUwtTelemetryDiagnostics}.
 *
 * @group Interfaces
 */
export interface UwtTelemetryDiagnosticsConfig {
  /**
   * Whether the popup can be opened at all. A function is read once, at
   * startup — use it to limit access to, say, support staff.
   */
  enabled: boolean | (() => boolean);

  /**
   * Shortcuts that open the popup. An empty array disables the keyboard,
   * leaving {@link UwtTelemetryDiagnosticsService.open} as the only way in.
   */
  shortcuts: readonly UwtDiagnosticsShortcut[];

  /** Events kept per section; the oldest are dropped beyond this. */
  maxEventsPerSection: number;

  /**
   * Payloads whose JSON is longer than this many characters are shown
   * truncated. The download always contains them in full.
   *
   * Characters (UTF-16 code units, JavaScript's `length`), not bytes: the
   * limit protects rendering, which costs by the length of the text.
   */
  maxPayloadCharsInView: number;
}

/** @group Tokens */
export const UWT_TELEMETRY_DIAGNOSTICS_CONFIG =
  new InjectionToken<UwtTelemetryDiagnosticsConfig>(
    'UWT_TELEMETRY_DIAGNOSTICS_CONFIG'
  );

/** A flattened leaf of an event, used for filtering. */
export interface UwtDiagnosticsField {
  /** Exact path, e.g. `steps[2].name`. */
  path: string;

  /** Path with array indexes removed, e.g. `steps[].name`. */
  pattern: string;

  /** The value as text. */
  value: string;
}

/** One captured event, prepared once for display and filtering. */
export interface UwtDiagnosticsEntry {
  event: UwtTelemetryObservedEvent;
  section: UwtDiagnosticsSectionId;
  fields: readonly UwtDiagnosticsField[];
  /** Length of the payload's JSON, in characters (UTF-16 code units). */
  sizeChars: number;
  /** Set when the event could not be prepared for display. */
  renderError?: string;
}

/**
 * How a field filter compares.
 *
 * @group Types
 */
export type UwtDiagnosticsFilterOperator =
  'contains' | 'equals' | 'not-contains' | 'exists' | 'missing';

/** @group Interfaces */
export interface UwtDiagnosticsFieldFilter {
  id: string;
  path: string;
  operator: UwtDiagnosticsFilterOperator;
  value: string;
}

/** @group Interfaces */
export interface UwtDiagnosticsFilterState {
  /** Free text, matched against every value and path. */
  text: string;
  fields: readonly UwtDiagnosticsFieldFilter[];
}

/**
 * A downloaded JSON file: one section's captured events.
 *
 * `events` holds every event captured in that section, oldest first,
 * regardless of the filters on screen. `activeFilters` records that
 * section's filters, for context; they were not applied to `events`.
 *
 * @group Interfaces
 */
export interface UwtDiagnosticsExport {
  format: 'ngx-ui-watchtower-diagnostics';
  formatVersion: 1;
  section: UwtDiagnosticsSectionId;
  exportedAt: string;
  capture: { startedAt: string; endedAt: string; paused: boolean };
  app: {
    application: string;
    environment: string;
    version: string;
    eventNamespace: string;
  };
  session: { sessionId?: string; userId?: string };
  userAgent: string;
  activeFilters: UwtDiagnosticsFilterState;
  count: { captured: number; droppedOldest: number };
  events: UwtTelemetryObservedEvent[];
}
