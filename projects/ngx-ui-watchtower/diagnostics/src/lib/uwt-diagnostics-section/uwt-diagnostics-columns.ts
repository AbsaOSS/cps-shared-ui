import { UwtTelemetryObservedEvent } from '@absaoss-cps/ngx-ui-watchtower';
import {
  UwtDiagnosticsEntry,
  UwtDiagnosticsSectionId
} from '../uwt-diagnostics.models/uwt-diagnostics.models';

/** One column of a section's table. */
export interface UwtDiagnosticsColumn {
  key: string;
  header: string;
  /** Hidden on narrow screens. */
  secondary?: boolean;
  value: (event: UwtTelemetryObservedEvent) => string;
}

/** One table row: display text, plus the entry for the detail view. */
export interface UwtDiagnosticsRow {
  sequence: number;
  time: string;
  cells: Record<string, string>;
  forwardedFrom?: string;
  entry: UwtDiagnosticsEntry;
}

/** Reads a field as text, whatever the payload's declared type. */
function text(payload: unknown, key: string): string {
  if (payload === null || typeof payload !== 'object') {
    return '';
  }
  const value = (payload as Record<string, unknown>)[key];
  return value === undefined || value === null ? '' : String(value);
}

function metadataSummary(payload: unknown): string {
  if (payload === null || typeof payload !== 'object') {
    return '';
  }
  const metadata = (payload as Record<string, unknown>).metadata;
  if (metadata === null || typeof metadata !== 'object') {
    return '';
  }
  const pairs = Object.entries(metadata as Record<string, unknown>);
  const shown = pairs
    .slice(0, 3)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(', ');
  return pairs.length > 3 ? `${shown}, …` : shown;
}

function ms(value: string): string {
  return value === '' ? '' : `${value} ms`;
}

function eventTypeOf(event: UwtTelemetryObservedEvent): string {
  return 'eventType' in event ? event.eventType : '';
}

export const UWT_DIAGNOSTICS_COLUMNS: Record<
  UwtDiagnosticsSectionId,
  readonly UwtDiagnosticsColumn[]
> = {
  bi: [
    {
      key: 'name',
      header: 'Event',
      value: (e) =>
        e.kind === 'unknown'
          ? `${eventTypeOf(e)} (unrecognised type)`
          : text(e.payload, 'eventName')
    },
    { key: 'type', header: 'Event type', secondary: true, value: eventTypeOf },
    {
      key: 'scenario',
      header: 'Scenario id',
      secondary: true,
      value: (e) => text(e.payload, 'scenarioId')
    },
    {
      key: 'feature',
      header: 'Feature',
      secondary: true,
      value: (e) => text(e.payload, 'feature')
    },
    {
      key: 'metadata',
      header: 'Metadata',
      value: (e) => metadataSummary(e.payload)
    }
  ],
  scenario: [
    {
      key: 'name',
      header: 'Scenario',
      value: (e) => text(e.payload, 'scenarioName')
    },
    {
      key: 'kind',
      header: 'Event',
      value: (e) => (e.kind === 'scenario-step' ? 'step' : 'record')
    },
    {
      key: 'status',
      header: 'Status',
      value: (e) =>
        e.kind === 'scenario-step'
          ? [text(e.payload, 'name'), text(e.payload, 'status')]
              .filter(Boolean)
              .join(' · ')
          : text(e.payload, 'status')
    },
    {
      key: 'duration',
      header: 'Duration',
      value: (e) =>
        ms(text(e.payload, e.kind === 'scenario-step' ? 'stepDelta' : 'delta'))
    },
    {
      key: 'steps',
      header: 'Steps',
      secondary: true,
      value: (e) => text(e.payload, 'stepCount')
    },
    {
      key: 'id',
      header: 'Scenario id',
      secondary: true,
      value: (e) => text(e.payload, 'scenarioId')
    }
  ],
  logging: [
    {
      key: 'level',
      header: 'Level',
      value: (e) =>
        e.kind === 'error' ? 'error → RUM' : text(e.payload, 'level')
    },
    {
      key: 'logger',
      header: 'Logger',
      value: (e) => text(e.payload, 'logger')
    },
    {
      key: 'context',
      header: 'Context',
      secondary: true,
      value: (e) => text(e.payload, 'context')
    },
    {
      key: 'message',
      header: 'Message',
      value: (e) =>
        e.kind === 'error'
          ? `${text(e.payload, 'name')}: ${text(e.payload, 'message')}`
          : text(e.payload, 'message')
    },
    {
      key: 'correlation',
      header: 'Correlation id',
      secondary: true,
      value: (e) => text(e.payload, 'correlationId')
    }
  ]
};

/** `HH:MM:SS.mmm` in local time — the precision that orders a burst. */
export function uwtDiagnosticsTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}.${pad(date.getMilliseconds(), 3)}`;
}

export function uwtDiagnosticsRow(
  entry: UwtDiagnosticsEntry,
  columns: readonly UwtDiagnosticsColumn[]
): UwtDiagnosticsRow {
  const { event } = entry;
  const cells: Record<string, string> = {};
  for (const column of columns) {
    try {
      cells[column.key] = column.value(event);
    } catch {
      cells[column.key] = '';
    }
  }
  return {
    sequence: event.sequence,
    time: uwtDiagnosticsTime(event.capturedAt),
    cells,
    forwardedFrom: event.origin.forwarded
      ? (event.origin.application ?? 'another app')
      : undefined,
    entry
  };
}
