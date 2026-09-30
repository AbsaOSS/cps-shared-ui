import { InjectionToken } from '@angular/core';
import { CpsTelemetryObservedEvent } from 'cps-telemetry';

/**
 * The three sections of the diagnostics popup.
 *
 * @group Types
 */
export type CpsDiagnosticsSectionId = 'bi' | 'scenario' | 'logging';

/**
 * A key combination that opens the diagnostics popup.
 *
 * Matched on `KeyboardEvent.code` — the physical key — so it works on every
 * keyboard layout, and isn't affected by what Option or Shift produce.
 * A modifier left out must be *up*, so extra modifiers never match.
 *
 * @group Interfaces
 */
export interface CpsDiagnosticsShortcut {
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
 * Configuration for {@link provideCpsTelemetryDiagnostics}.
 *
 * @group Interfaces
 */
export interface CpsTelemetryDiagnosticsConfig {
  /**
   * Whether the popup can be opened at all. A function is read once, at
   * startup — use it to limit access to, say, support staff.
   */
  enabled: boolean | (() => boolean);

  /**
   * Shortcuts that open the popup. An empty array disables the keyboard,
   * leaving {@link CpsTelemetryDiagnosticsService.open} as the only way in.
   */
  shortcuts: readonly CpsDiagnosticsShortcut[];

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
export const CPS_TELEMETRY_DIAGNOSTICS_CONFIG =
  new InjectionToken<CpsTelemetryDiagnosticsConfig>(
    'CPS_TELEMETRY_DIAGNOSTICS_CONFIG'
  );

/** A flattened leaf of an event, used for filtering. */
export interface CpsDiagnosticsField {
  /** Exact path, e.g. `steps[2].name`. */
  path: string;

  /** Path with array indexes removed, e.g. `steps[].name`. */
  pattern: string;

  /** The value as text. */
  value: string;
}

/** One captured event, prepared once for display and filtering. */
export interface CpsDiagnosticsEntry {
  event: CpsTelemetryObservedEvent;
  section: CpsDiagnosticsSectionId;
  fields: readonly CpsDiagnosticsField[];
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
export type CpsDiagnosticsFilterOperator =
  'contains' | 'equals' | 'not-contains' | 'exists' | 'missing';

/** @group Interfaces */
export interface CpsDiagnosticsFieldFilter {
  id: string;
  path: string;
  operator: CpsDiagnosticsFilterOperator;
  value: string;
}

/** @group Interfaces */
export interface CpsDiagnosticsFilterState {
  /** Free text, matched against every value and path. */
  text: string;
  fields: readonly CpsDiagnosticsFieldFilter[];
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
export interface CpsDiagnosticsExport {
  format: 'cps-telemetry-diagnostics';
  formatVersion: 1;
  section: CpsDiagnosticsSectionId;
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
  activeFilters: CpsDiagnosticsFilterState;
  count: { captured: number; droppedOldest: number };
  events: CpsTelemetryObservedEvent[];
}
