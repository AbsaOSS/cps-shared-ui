import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  UwtTelemetryMonitor,
  UwtTelemetryPublishInput
} from '@absaoss-cps/ngx-ui-watchtower';
import { UWT_TELEMETRY_DIAGNOSTICS_CONFIG } from '../uwt-diagnostics.models/uwt-diagnostics.models';
import {
  UWT_DIAGNOSTICS_FLUSH_MS,
  UwtDiagnosticsStore
} from './uwt-diagnostics-store';

const bi = (name: string): UwtTelemetryPublishInput => ({
  kind: 'bi',
  eventType: 'com.uwt.bi',
  payload: {
    eventName: name,
    eventTime: '2026-01-01T00:00:00.000Z',
    application: 'app'
  },
  destination: 'sink',
  origin: { forwarded: false }
});

const log = (message: string): UwtTelemetryPublishInput => ({
  kind: 'log',
  payload: {
    timestamp: '2026-01-01T00:00:00.000Z',
    level: 'warn',
    message,
    logger: 'checkout',
    application: 'app',
    environment: 'test',
    version: '1'
  },
  destination: 'log-provider',
  origin: { forwarded: false }
});

describe('UwtDiagnosticsStore', () => {
  let monitor: UwtTelemetryMonitor;
  let injector: Injector;

  function createStore(max = 500): UwtDiagnosticsStore {
    injector = Injector.create({
      providers: [
        UwtDiagnosticsStore,
        {
          provide: UWT_TELEMETRY_DIAGNOSTICS_CONFIG,
          useValue: { maxEventsPerSection: max }
        }
      ],
      parent: TestBed.inject(Injector)
    });
    return injector.get(UwtDiagnosticsStore);
  }

  const flush = () => jest.advanceTimersByTime(UWT_DIAGNOSTICS_FLUSH_MS);
  const names = (store: UwtDiagnosticsStore) =>
    store
      .entries()
      .bi.map((e) => (e.event.payload as { eventName: string }).eventName);

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.resetTestingModule();
    monitor = TestBed.inject(UwtTelemetryMonitor);
  });

  function destroy(): void {
    const target = injector as unknown as {
      destroy(): void;
      destroyed: boolean;
    };
    if (target && !target.destroyed) {
      target.destroy();
    }
  }

  afterEach(() => {
    destroy();
    jest.useRealTimers();
  });

  it('should start empty, and ignore everything sent before it existed', () => {
    monitor.publish(bi('before')); // nobody observing yet
    const store = createStore();
    flush();

    expect(store.total()).toBe(0);
  });

  it('should batch arrivals into one update per flush', () => {
    const store = createStore();
    monitor.publish(bi('a'));
    monitor.publish(bi('b'));

    expect(store.total()).toBe(0); // not on screen yet
    flush();
    expect(names(store)).toEqual(['b', 'a']); // newest first
  });

  it('should route each kind to its section', () => {
    const store = createStore();
    monitor.publish(bi('a'));
    monitor.publish(log('careful'));
    flush();

    expect(store.entries().bi).toHaveLength(1);
    expect(store.entries().logging).toHaveLength(1);
    expect(store.entries().scenario).toHaveLength(0);
  });

  it('should keep at most the configured number per section, counting drops', () => {
    const store = createStore(2);
    ['a', 'b', 'c', 'd'].forEach((n) => monitor.publish(bi(n)));
    monitor.publish(log('kept'));
    flush();

    expect(names(store)).toEqual(['d', 'c']);
    expect(store.dropped().bi).toBe(2);
    // A noisy section never evicts another.
    expect(store.entries().logging).toHaveLength(1);
  });

  it('should clear everything and keep capturing', () => {
    const store = createStore();
    monitor.publish(bi('a'));
    flush();

    store.clear();
    expect(store.total()).toBe(0);

    monitor.publish(bi('after'));
    flush();
    expect(names(store)).toEqual(['after']);
  });

  it('should freeze the view while paused, but keep capturing', () => {
    const store = createStore();
    monitor.publish(bi('a'));
    flush();

    store.setPaused(true);
    monitor.publish(bi('b'));
    monitor.publish(bi('c'));
    flush();
    expect(names(store)).toEqual(['a']);
    expect(store.newWhilePaused()).toBe(2);
    // The section's download still contains them.
    expect(store.sectionEvents('bi')).toHaveLength(3);

    store.setPaused(false);
    expect(names(store)).toEqual(['c', 'b', 'a']);
    expect(store.newWhilePaused()).toBe(0);
  });

  it('should include not-yet-flushed events in the download without hiding them', () => {
    const store = createStore();
    monitor.publish(bi('a'));

    expect(store.sectionEvents('bi')).toHaveLength(1);
    expect(store.sectionCount('bi')).toEqual({ captured: 1, droppedOldest: 0 });

    flush();
    expect(names(store)).toEqual(['a']);
  });

  it("should export only a section's own events, oldest first", () => {
    const store = createStore();
    monitor.publish(bi('first'));
    monitor.publish(log('a log line'));
    monitor.publish(bi('second'));
    flush();

    const events = store.sectionEvents('bi');
    expect(events.map((e) => e.kind)).toEqual(['bi', 'bi']);
    expect(events[0].sequence).toBeLessThan(events[1].sequence);
    expect(store.sectionEvents('logging')).toHaveLength(1);
    expect(store.sectionEvents('scenario')).toHaveLength(0);
  });

  it('should filter each section on its own, ignoring case', () => {
    const store = createStore();
    monitor.publish(bi('theme_changed'));
    monitor.publish(bi('sidebar_toggled'));
    monitor.publish(log('Careful now'));
    flush();

    store.setText('bi', 'THEME');
    expect(store.filtered().bi).toHaveLength(1);
    // Other sections are untouched by BI's filter.
    expect(store.filtered().logging).toHaveLength(1);
    expect(store.isFiltering('bi')).toBe(true);
    expect(store.isFiltering('logging')).toBe(false);

    store.addFilter('logging', {
      path: 'level',
      operator: 'equals',
      value: 'error'
    });
    expect(store.filtered().logging).toHaveLength(0);
    expect(store.filtered().bi).toHaveLength(1);

    store.removeFilter('logging', store.filters().logging.fields[0].id);
    expect(store.filtered().logging).toHaveLength(1);

    store.clearFilters('bi');
    expect(store.filtered().bi).toHaveLength(2);
  });

  it('should suggest filter fields from each section separately', () => {
    const store = createStore();
    monitor.publish(bi('a'));
    monitor.publish(log('b'));
    flush();

    expect(store.knownPaths().logging).toContain('level');
    expect(store.knownPaths().bi).not.toContain('level');
    expect(store.knownPaths().bi).toContain('eventName');
  });

  it('should mark the latest arrivals as new, briefly', () => {
    const store = createStore();
    monitor.publish(bi('a'));
    flush();

    const [entry] = store.entries().bi;
    expect(store.fresh().has(entry.event.sequence)).toBe(true);
    jest.advanceTimersByTime(3000);
    expect(store.fresh().size).toBe(0);
  });

  it('should keep going after an event it cannot prepare', () => {
    const store = createStore();
    const payload: Record<string, unknown> = { eventName: 'x' };
    Object.defineProperty(payload, 'boom', {
      enumerable: true,
      get: () => {
        throw new Error('bad getter');
      }
    });
    // Delivered as-is, bypassing the monitor's copy, to simulate a bad payload.
    (store as unknown as { receive(e: unknown): void }).receive({
      ...bi('x'),
      payload,
      sequence: 99,
      capturedAt: ''
    });
    monitor.publish(bi('fine'));
    flush();

    expect(store.entries().bi).toHaveLength(2);
    expect(store.entries().bi[1].renderError).toBe('bad getter');
  });

  it('should stop observing when destroyed', () => {
    createStore();
    expect(monitor.observed).toBe(true);

    destroy();
    expect(monitor.observed).toBe(false);
  });
});
