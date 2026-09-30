import { isDevMode } from '@angular/core';
import { CpsBiEvent } from '../../models/cps-bi.models/cps-bi.models';
import { CpsTelemetryObservedEvent } from '../../models/cps-telemetry-monitor.models/cps-telemetry-monitor.models';
import * as safeUtil from '../../utils/cps-telemetry-safe.util/cps-telemetry-safe.util';
import { CpsTelemetryMonitor } from './cps-telemetry-monitor.service';

jest.mock('@angular/core', () => ({
  ...jest.requireActual('@angular/core'),
  isDevMode: jest.fn(() => false)
}));

function biEvent(): CpsBiEvent {
  return {
    eventName: 'export_clicked',
    eventTime: '2026-01-01T00:00:00.000Z',
    metadata: { format: 'csv' },
    application: 'test-app'
  };
}

describe('CpsTelemetryMonitor', () => {
  let monitor: CpsTelemetryMonitor;
  let received: CpsTelemetryObservedEvent[];

  beforeEach(() => {
    monitor = new CpsTelemetryMonitor();
    received = [];
  });

  afterEach(() => {
    monitor.ngOnDestroy();
    jest.restoreAllMocks();
  });

  function publishBi(payload = biEvent()): number | undefined {
    return monitor.publish({
      kind: 'bi',
      eventType: 'com.cps.bi',
      payload,
      destination: 'sink',
      origin: { forwarded: false }
    });
  }

  it('should do nothing, and copy nothing, while nobody is subscribed', () => {
    const clone = jest.spyOn(safeUtil, 'cpsDeepClone');

    expect(monitor.observed).toBe(false);
    expect(publishBi()).toBeUndefined();
    expect(clone).not.toHaveBeenCalled();
  });

  it('should deliver an event to a subscriber, with the envelope filled in', () => {
    monitor.events$.subscribe((e) => received.push(e));

    const sequence = publishBi();

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      kind: 'bi',
      eventType: 'com.cps.bi',
      destination: 'sink',
      origin: { forwarded: false },
      sequence
    });
    expect(received[0].capturedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it('should hand a subscriber a copy, isolated from the object that was sent', () => {
    monitor.events$.subscribe((e) => received.push(e));
    const sent = biEvent();

    publishBi(sent);
    const observed = received[0].payload as CpsBiEvent;

    expect(observed).toEqual(sent);
    expect(observed).not.toBe(sent);

    observed.metadata!.format = 'changed-by-observer';
    sent.metadata!.format = 'changed-by-sender';
    expect(sent.metadata!.format).toBe('changed-by-sender');
    expect(observed.metadata!.format).toBe('changed-by-observer');
  });

  it('should number events in increasing order', () => {
    monitor.events$.subscribe((e) => received.push(e));

    publishBi();
    publishBi();
    publishBi();

    const [a, b, c] = received.map((e) => e.sequence);
    expect(b).toBe(a + 1);
    expect(c).toBe(b + 1);
  });

  it('should stop observing once the last subscriber leaves', () => {
    const subscription = monitor.events$.subscribe((e) => received.push(e));
    subscription.unsubscribe();

    expect(monitor.observed).toBe(false);
    expect(publishBi()).toBeUndefined();
    expect(received).toHaveLength(0);
  });

  it('should never throw into the hand-off site, even when copying fails', () => {
    (isDevMode as jest.Mock).mockReturnValue(false);
    monitor.events$.subscribe((e) => received.push(e));
    jest.spyOn(safeUtil, 'cpsDeepClone').mockImplementation(() => {
      throw new Error('clone failed');
    });

    expect(() => publishBi()).not.toThrow();
    expect(received).toHaveLength(0);
  });
});
