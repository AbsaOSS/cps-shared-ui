import {
  UwtTelemetryEventKind,
  UwtTelemetryObservedEvent
} from '@absaoss-cps/ngx-ui-watchtower';
import {
  UwtDiagnosticsField,
  UwtDiagnosticsFieldFilter,
  UwtDiagnosticsFilterOperator,
  UwtDiagnosticsFilterState,
  UwtDiagnosticsSectionId
} from '../uwt-diagnostics.models/uwt-diagnostics.models';

/** Deeper structures are cut off, so a pathological payload stays cheap. */
const MAX_DEPTH = 12;
/** Leaves per event considered for filtering. */
const MAX_FIELDS = 2000;
/** Characters of each value considered for matching. */
const MAX_VALUE_CHARS = 2000;

/**
 * Which section an event is shown in. An event forwarded from another
 * realm with an unrecognised type is shown with BI, alongside the other
 * custom events.
 */
export function uwtDiagnosticsSectionOf(
  kind: UwtTelemetryEventKind
): UwtDiagnosticsSectionId {
  switch (kind) {
    case 'scenario':
    case 'scenario-step':
      return 'scenario';
    case 'log':
    case 'error':
      return 'logging';
    default:
      return 'bi';
  }
}

/**
 * Every leaf of an event as `path = value` text, done once when the event
 * arrives so filtering never walks payloads again.
 *
 * Payload fields come first, at their own paths (`metadata.theme`,
 * `steps[2].name`); the envelope follows (`kind`, `eventType`,
 * `destination`, `origin.application`, `sequence`, `capturedAt`). Cycles,
 * excessive depth and oversized strings are cut short rather than failing.
 */
export function uwtFlattenEvent(
  event: UwtTelemetryObservedEvent
): UwtDiagnosticsField[] {
  const fields: UwtDiagnosticsField[] = [];
  const seen = new WeakSet<object>();

  const visit = (value: unknown, path: string, depth: number): void => {
    if (fields.length >= MAX_FIELDS) {
      return;
    }
    if (value === null || typeof value !== 'object') {
      if (value !== undefined) {
        push(fields, path, String(value));
      }
      return;
    }
    if (seen.has(value)) {
      push(fields, path, '[Circular]');
      return;
    }
    if (depth >= MAX_DEPTH) {
      push(fields, path, '[Too deep]');
      return;
    }
    seen.add(value);

    const entries: [string, unknown][] = Array.isArray(value)
      ? value.map((v, i) => [`[${i}]`, v])
      : Object.entries(value).map(([k, v]) => [path ? `.${k}` : k, v]);

    if (entries.length === 0) {
      // Still addressable, so `exists` can find an empty object or array.
      push(fields, path, '');
      return;
    }
    for (const [suffix, child] of entries) {
      visit(child, path + suffix, depth + 1);
    }
  };

  visit(event.payload, '', 0);

  const { payload: _payload, ...envelope } = event;
  visit(envelope, '', 0);
  return fields;
}

function push(fields: UwtDiagnosticsField[], path: string, value: string) {
  fields.push({
    path,
    pattern: path.replace(/\[\d+\]/g, '[]'),
    value:
      value.length > MAX_VALUE_CHARS ? value.slice(0, MAX_VALUE_CHARS) : value
  });
}

/**
 * Whether an event's fields satisfy every active filter.
 *
 * - Free text: case-insensitive, matched against every value and path.
 * - A field filter's path matches a field's exact path or its pattern, so
 *   `steps[].name` covers every step and `steps[2].name` only the third.
 *   With several matching fields, one is enough.
 * - Everything is combined with AND.
 */
export function uwtMatchesFilters(
  fields: readonly UwtDiagnosticsField[],
  filters: UwtDiagnosticsFilterState
): boolean {
  const text = filters.text.trim().toLowerCase();
  if (
    text &&
    !fields.some(
      (f) =>
        f.value.toLowerCase().includes(text) ||
        f.path.toLowerCase().includes(text)
    )
  ) {
    return false;
  }
  return filters.fields.every((filter) => matchesField(fields, filter));
}

function matchesField(
  fields: readonly UwtDiagnosticsField[],
  filter: UwtDiagnosticsFieldFilter
): boolean {
  const path = filter.path.trim().toLowerCase();
  const value = filter.value.trim().toLowerCase();
  const atPath = fields.filter(
    (f) => f.path.toLowerCase() === path || f.pattern.toLowerCase() === path
  );

  switch (filter.operator) {
    case 'exists':
      return atPath.length > 0;
    case 'missing':
      return atPath.length === 0;
    case 'equals':
      return atPath.some((f) => f.value.toLowerCase() === value);
    case 'not-contains':
      return !atPath.some((f) => f.value.toLowerCase().includes(value));
    case 'contains':
    default:
      return atPath.some((f) => f.value.toLowerCase().includes(value));
  }
}

const OPERATOR_TEXT: Record<UwtDiagnosticsFilterOperator, string> = {
  contains: 'contains',
  equals: 'equals',
  'not-contains': 'does not contain',
  exists: 'exists',
  missing: 'is missing'
};

/** A filter as a short sentence, for chips and screen readers. */
export function uwtDescribeFilter(filter: UwtDiagnosticsFieldFilter): string {
  const op = OPERATOR_TEXT[filter.operator];
  return filter.operator === 'exists' || filter.operator === 'missing'
    ? `${filter.path} ${op}`
    : `${filter.path} ${op} "${filter.value}"`;
}

/** Whether an operator compares against a value. */
export function uwtOperatorNeedsValue(
  operator: UwtDiagnosticsFilterOperator
): boolean {
  return operator !== 'exists' && operator !== 'missing';
}

/**
 * Field paths to suggest, from everything captured so far: envelope fields
 * first, then the rest by how often they occur.
 */
export function uwtKnownPaths(
  fieldSets: readonly (readonly UwtDiagnosticsField[])[]
): string[] {
  const envelope = [
    'kind',
    'eventType',
    'destination',
    'origin.application',
    'capturedAt'
  ];
  const counts = new Map<string, number>();
  for (const fields of fieldSets) {
    for (const f of new Set(fields.map((x) => x.pattern))) {
      if (
        !envelope.includes(f) &&
        f !== 'sequence' &&
        f !== 'origin.forwarded'
      ) {
        counts.set(f, (counts.get(f) ?? 0) + 1);
      }
    }
  }
  const rest = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([path]) => path);
  return [...envelope, ...rest];
}
