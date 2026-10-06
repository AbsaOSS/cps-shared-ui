import { UwtTelemetryObservedEvent } from '@absaoss-cps/ngx-ui-watchtower';
import {
  UwtDiagnosticsFieldFilter,
  UwtDiagnosticsFilterState
} from '../uwt-diagnostics.models/uwt-diagnostics.models';
import {
  uwtDescribeFilter,
  uwtDiagnosticsSectionOf,
  uwtFlattenEvent,
  uwtKnownPaths,
  uwtMatchesFilters
} from './uwt-diagnostics-filter';

const base = {
  sequence: 7,
  capturedAt: '2026-01-01T10:00:00.000Z',
  destination: 'sink' as const,
  origin: { forwarded: false as const }
};

const scenario: UwtTelemetryObservedEvent = {
  ...base,
  kind: 'scenario',
  eventType: 'com.uwt.scenario',
  payload: {
    scenarioId: 'abc-123',
    scenarioName: 'load-dashboard',
    status: 'failure',
    startTime: '2026-01-01T09:59:59.000Z',
    delta: 812,
    elapsed: 5000,
    stepCount: 2,
    steps: [
      { name: 'scenario-start', startOffset: 0 },
      { name: 'fetch', startOffset: 10, status: 'success' },
      { name: 'render', startOffset: 400, status: 'failure' }
    ],
    metadata: { theme: 'Dark', retry: null },
    application: 'app'
  }
};

function state(
  text = '',
  fields: Partial<UwtDiagnosticsFieldFilter>[] = []
): UwtDiagnosticsFilterState {
  return {
    text,
    fields: fields.map((f, i) => ({
      id: String(i),
      path: '',
      operator: 'contains',
      value: '',
      ...f
    }))
  };
}

describe('uwtFlattenEvent', () => {
  const fields = uwtFlattenEvent(scenario);
  const byPath = (p: string) => fields.find((f) => f.path === p);

  it('should expose nested payload fields at their own paths', () => {
    expect(byPath('metadata.theme')?.value).toBe('Dark');
    expect(byPath('scenarioName')?.value).toBe('load-dashboard');
  });

  it('should index array items, with an index-free pattern', () => {
    expect(byPath('steps[2].name')).toEqual({
      path: 'steps[2].name',
      pattern: 'steps[].name',
      value: 'render'
    });
  });

  it('should include the envelope', () => {
    expect(byPath('kind')?.value).toBe('scenario');
    expect(byPath('eventType')?.value).toBe('com.uwt.scenario');
    expect(byPath('origin.forwarded')?.value).toBe('false');
    expect(byPath('sequence')?.value).toBe('7');
  });

  it('should keep null as text, and address empty containers', () => {
    expect(byPath('metadata.retry')?.value).toBe('null');
    const empty = uwtFlattenEvent({
      ...base,
      kind: 'bi',
      eventType: 'com.uwt.bi',
      payload: { tags: [], extra: {} }
    });
    expect(empty.map((f) => f.path)).toEqual(
      expect.arrayContaining(['tags', 'extra'])
    );
  });

  it('should survive a circular payload', () => {
    const payload: Record<string, unknown> = { a: 1 };
    payload.self = payload;
    const event = {
      ...base,
      kind: 'unknown',
      eventType: 'x',
      payload
    } as unknown as UwtTelemetryObservedEvent;

    const result = uwtFlattenEvent(event);
    expect(result.find((f) => f.path === 'self')?.value).toBe('[Circular]');
  });

  it('should cap the number of fields for a huge payload', () => {
    const payload = Object.fromEntries(
      Array.from({ length: 5000 }, (_, i) => [`k${i}`, i])
    );
    const result = uwtFlattenEvent({
      ...base,
      kind: 'bi',
      eventType: 'com.uwt.bi',
      payload
    });
    expect(result.length).toBeLessThanOrEqual(2000 + 10);
  });
});

describe('uwtMatchesFilters', () => {
  const fields = uwtFlattenEvent(scenario);
  const matches = (s: UwtDiagnosticsFilterState) =>
    uwtMatchesFilters(fields, s);

  it('should match everything with no filters', () => {
    expect(matches(state())).toBe(true);
  });

  it('should match free text anywhere, ignoring case', () => {
    expect(matches(state('DASHBOARD'))).toBe(true);
    expect(matches(state('dark'))).toBe(true);
    expect(matches(state('metadata.the'))).toBe(true); // path text too
    expect(matches(state('nowhere'))).toBe(false);
  });

  it('should apply contains, equals and not-contains to one path', () => {
    expect(matches(state('', [{ path: 'scenarioName', value: 'dash' }]))).toBe(
      true
    );
    expect(
      matches(
        state('', [{ path: 'scenarioName', operator: 'equals', value: 'dash' }])
      )
    ).toBe(false);
    expect(
      matches(
        state('', [
          { path: 'status', operator: 'not-contains', value: 'success' }
        ])
      )
    ).toBe(true);
  });

  it('should match any array item by pattern, or one item by index', () => {
    expect(
      matches(state('', [{ path: 'steps[].name', value: 'render' }]))
    ).toBe(true);
    expect(
      matches(state('', [{ path: 'steps[1].name', value: 'render' }]))
    ).toBe(false);
  });

  it('should treat exists and missing as presence checks', () => {
    expect(
      matches(state('', [{ path: 'metadata.theme', operator: 'exists' }]))
    ).toBe(true);
    expect(
      matches(state('', [{ path: 'error.message', operator: 'missing' }]))
    ).toBe(true);
  });

  it('should require every filter and the text together', () => {
    expect(
      matches(
        state('dashboard', [
          { path: 'status', operator: 'equals', value: 'failure' },
          { path: 'metadata.theme', value: 'light' }
        ])
      )
    ).toBe(false);
  });

  it('should find nothing for a path that does not exist', () => {
    expect(matches(state('', [{ path: 'level', value: 'warn' }]))).toBe(false);
  });
});

describe('helpers', () => {
  it('should put each kind in its section', () => {
    expect(uwtDiagnosticsSectionOf('bi')).toBe('bi');
    expect(uwtDiagnosticsSectionOf('unknown')).toBe('bi');
    expect(uwtDiagnosticsSectionOf('scenario-step')).toBe('scenario');
    expect(uwtDiagnosticsSectionOf('error')).toBe('logging');
  });

  it('should describe a filter as a short sentence', () => {
    expect(
      uwtDescribeFilter({
        id: '1',
        path: 'level',
        operator: 'not-contains',
        value: 'log'
      })
    ).toBe('level does not contain "log"');
    expect(
      uwtDescribeFilter({
        id: '1',
        path: 'error',
        operator: 'exists',
        value: ''
      })
    ).toBe('error exists');
  });

  it('should suggest envelope paths first, then the most common', () => {
    const paths = uwtKnownPaths([
      uwtFlattenEvent(scenario),
      uwtFlattenEvent(scenario)
    ]);
    expect(paths.slice(0, 5)).toEqual([
      'kind',
      'eventType',
      'destination',
      'origin.application',
      'capturedAt'
    ]);
    expect(paths).toContain('steps[].name');
    expect(new Set(paths).size).toBe(paths.length);
  });
});
