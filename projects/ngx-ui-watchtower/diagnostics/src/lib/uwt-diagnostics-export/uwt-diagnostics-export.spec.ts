import { UwtTelemetryObservedEvent } from '@absaoss-cps/ngx-ui-watchtower';
import {
  uwtBuildDiagnosticsExport,
  uwtDiagnosticsFilename,
  uwtDownloadJson,
  uwtSafeStringify
} from './uwt-diagnostics-export';

function bi(sequence: number): UwtTelemetryObservedEvent {
  return {
    kind: 'bi',
    eventType: 'com.uwt.bi',
    sequence,
    capturedAt: '2026-01-01T10:00:00.000Z',
    destination: 'sink',
    origin: { forwarded: false },
    payload: {
      eventName: `e${sequence}`,
      eventTime: '2026-01-01T10:00:00.000Z',
      application: 'app',
      metadata: { nested: 'kept' }
    }
  };
}

const context = {
  section: 'bi' as const,
  startedAt: '2026-01-01T09:00:00.000Z',
  paused: false,
  app: {
    application: 'app',
    environment: 'test',
    version: '1.0.0',
    eventNamespace: 'com.uwt'
  },
  session: { sessionId: 's-1' },
  userAgent: 'jest',
  activeFilters: {
    text: 'e2',
    fields: [
      { id: '1', path: 'kind', operator: 'equals' as const, value: 'bi' }
    ]
  },
  count: { captured: 3, droppedOldest: 0 },
  now: new Date('2026-01-01T10:05:00.000Z')
};

describe('uwtBuildDiagnosticsExport', () => {
  it("should contain every one of the section's events in hand-off order, whatever the filters", () => {
    const doc = uwtBuildDiagnosticsExport([bi(3), bi(1), bi(2)], context);

    expect(doc.events.map((e) => e.sequence)).toEqual([1, 2, 3]);
    // Filters are recorded for context, not applied.
    expect(doc.activeFilters.text).toBe('e2');
  });

  it('should carry the format, capture window and app identity', () => {
    const doc = uwtBuildDiagnosticsExport([bi(1)], context);

    expect(doc).toMatchObject({
      format: 'ngx-ui-watchtower-diagnostics',
      formatVersion: 1,
      section: 'bi',
      exportedAt: '2026-01-01T10:05:00.000Z',
      capture: {
        startedAt: '2026-01-01T09:00:00.000Z',
        endedAt: '2026-01-01T10:05:00.000Z',
        paused: false
      },
      app: { application: 'app', eventNamespace: 'com.uwt' },
      session: { sessionId: 's-1' },
      count: { captured: 3, droppedOldest: 0 }
    });
  });

  it('should round-trip as valid JSON with nested payloads intact', () => {
    const json = uwtSafeStringify(
      uwtBuildDiagnosticsExport([bi(1)], context),
      2
    );
    const parsed = JSON.parse(json);
    expect(parsed.events[0].payload.metadata.nested).toBe('kept');
  });
});

describe('uwtSafeStringify', () => {
  it('should replace a cycle instead of throwing', () => {
    const value: Record<string, unknown> = { a: 1 };
    value.self = value;
    expect(JSON.parse(uwtSafeStringify(value))).toEqual({
      a: 1,
      self: '[Circular]'
    });
  });

  it('should keep an object that is shared, but not circular', () => {
    const shared = { x: 1 };
    expect(JSON.parse(uwtSafeStringify({ a: shared, b: shared }))).toEqual({
      a: { x: 1 },
      b: { x: 1 }
    });
  });

  it('should write a bigint as text', () => {
    expect(uwtSafeStringify({ n: BigInt(12) })).toBe('{"n":"12"}');
  });
});

describe('uwtDiagnosticsFilename', () => {
  it('should name the app, section and time, and nothing identifying', () => {
    expect(
      uwtDiagnosticsFilename(
        'my app/x',
        'logging',
        new Date(2026, 0, 2, 3, 4, 5)
      )
    ).toBe(
      'ngx-ui-watchtower-diagnostics-my-app-x-logging-20260102-030405.json'
    );
  });
});

describe('uwtDownloadJson', () => {
  it('should click a temporary link to a JSON blob, then remove it', () => {
    const created = jest.fn(() => 'blob:x');
    Object.assign(URL, {
      createObjectURL: created,
      revokeObjectURL: jest.fn()
    });
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    uwtDownloadJson(document, 'f.json', '{}');

    expect(created).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
