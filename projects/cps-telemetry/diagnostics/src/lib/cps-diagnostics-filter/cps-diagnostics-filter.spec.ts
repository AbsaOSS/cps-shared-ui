import { CpsTelemetryObservedEvent } from 'cps-telemetry';
import {
  CpsDiagnosticsFieldFilter,
  CpsDiagnosticsFilterState
} from '../cps-diagnostics.models/cps-diagnostics.models';
import {
  cpsDescribeFilter,
  cpsDiagnosticsSectionOf,
  cpsFlattenEvent,
  cpsKnownPaths,
  cpsMatchesFilters
} from './cps-diagnostics-filter';

const base = {
  sequence: 7,
  capturedAt: '2026-01-01T10:00:00.000Z',
  destination: 'sink' as const,
  origin: { forwarded: false as const }
};

const scenario: CpsTelemetryObservedEvent = {
  ...base,
  kind: 'scenario',
  eventType: 'com.cps.scenario',
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
  fields: Partial<CpsDiagnosticsFieldFilter>[] = []
): CpsDiagnosticsFilterState {
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

describe('cpsFlattenEvent', () => {
  const fields = cpsFlattenEvent(scenario);
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
    expect(byPath('eventType')?.value).toBe('com.cps.scenario');
    expect(byPath('origin.forwarded')?.value).toBe('false');
    expect(byPath('sequence')?.value).toBe('7');
  });

  it('should keep null as text, and address empty containers', () => {
    expect(byPath('metadata.retry')?.value).toBe('null');
    const empty = cpsFlattenEvent({
      ...base,
      kind: 'bi',
      eventType: 'com.cps.bi',
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
    } as unknown as CpsTelemetryObservedEvent;

    const result = cpsFlattenEvent(event);
    expect(result.find((f) => f.path === 'self')?.value).toBe('[Circular]');
  });

  it('should cap the number of fields for a huge payload', () => {
    const payload = Object.fromEntries(
      Array.from({ length: 5000 }, (_, i) => [`k${i}`, i])
    );
    const result = cpsFlattenEvent({
      ...base,
      kind: 'bi',
      eventType: 'com.cps.bi',
      payload
    });
    expect(result.length).toBeLessThanOrEqual(2000 + 10);
  });
});

describe('cpsMatchesFilters', () => {
  const fields = cpsFlattenEvent(scenario);
  const matches = (s: CpsDiagnosticsFilterState) =>
    cpsMatchesFilters(fields, s);

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
    expect(cpsDiagnosticsSectionOf('bi')).toBe('bi');
    expect(cpsDiagnosticsSectionOf('unknown')).toBe('bi');
    expect(cpsDiagnosticsSectionOf('scenario-step')).toBe('scenario');
    expect(cpsDiagnosticsSectionOf('error')).toBe('logging');
  });

  it('should describe a filter as a short sentence', () => {
    expect(
      cpsDescribeFilter({
        id: '1',
        path: 'level',
        operator: 'not-contains',
        value: 'log'
      })
    ).toBe('level does not contain "log"');
    expect(
      cpsDescribeFilter({
        id: '1',
        path: 'error',
        operator: 'exists',
        value: ''
      })
    ).toBe('error exists');
  });

  it('should suggest envelope paths first, then the most common', () => {
    const paths = cpsKnownPaths([
      cpsFlattenEvent(scenario),
      cpsFlattenEvent(scenario)
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
