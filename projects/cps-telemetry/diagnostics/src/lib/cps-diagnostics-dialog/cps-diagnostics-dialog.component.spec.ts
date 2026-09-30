import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  CPS_TELEMETRY_IDENTITY,
  CpsTelemetryMonitor,
  CpsTelemetryPublishInput
} from 'cps-telemetry';
import { CPS_LIVE_ANNOUNCER_SERVICE } from 'cps-ui-kit';
import * as exportUtil from '../cps-diagnostics-export/cps-diagnostics-export';
import {
  CPS_DIAGNOSTICS_FLUSH_MS,
  CpsDiagnosticsStore
} from '../cps-diagnostics-store/cps-diagnostics-store';
import { CpsDiagnosticsDialogComponent } from './cps-diagnostics-dialog.component';

const bi = (name: string, theme = 'dark'): CpsTelemetryPublishInput => ({
  kind: 'bi',
  eventType: 'com.cps.bi',
  payload: {
    eventName: name,
    eventTime: '2026-01-01T00:00:00.000Z',
    application: 'app',
    metadata: { theme }
  },
  destination: 'sink',
  origin: { forwarded: false }
});

const scenario: CpsTelemetryPublishInput = {
  kind: 'scenario',
  eventType: 'com.cps.scenario',
  payload: {
    scenarioId: 'abc',
    scenarioName: 'load-dashboard',
    status: 'success',
    startTime: '2026-01-01T00:00:00.000Z',
    delta: 42,
    elapsed: 1000,
    stepCount: 1,
    steps: [],
    application: 'app'
  },
  destination: 'sink',
  origin: { forwarded: false }
};

const warn: CpsTelemetryPublishInput = {
  kind: 'log',
  payload: {
    timestamp: '2026-01-01T00:00:00.000Z',
    level: 'warn',
    message: 'Careful now',
    logger: 'checkout',
    application: 'app',
    environment: 'test',
    version: '1'
  },
  destination: 'log-provider',
  origin: { forwarded: false }
};

describe('CpsDiagnosticsDialogComponent', () => {
  let fixture: ComponentFixture<CpsDiagnosticsDialogComponent>;
  let monitor: CpsTelemetryMonitor;
  let announce: jest.Mock;

  const el = () => fixture.nativeElement as HTMLElement;
  /** The popup's own actions, as its buttons and switch call them. */
  const ui = () =>
    fixture.componentInstance as unknown as {
      setPaused(paused: boolean): void;
      clear(): void;
    };
  /** A button found by the start of its accessible name. */
  const button = (name: string) => {
    const found = el().querySelector<HTMLButtonElement>(
      `button[aria-label^="${name}"]`
    );
    if (!found) {
      throw new Error(`No button named "${name}…"`);
    }
    return found;
  };
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const titles = () =>
    Array.from(
      el().querySelectorAll('[data-testid="cps-expansion-panel-title"]')
    ).map((t) => t.textContent?.trim());
  const bodyRows = () =>
    el().querySelectorAll('td.cps-diagnostics-section__time').length;

  function settle(): void {
    jest.advanceTimersByTime(CPS_DIAGNOSTICS_FLUSH_MS);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    announce = jest.fn();
    await TestBed.configureTestingModule({
      imports: [CpsDiagnosticsDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: CPS_TELEMETRY_IDENTITY,
          useValue: {
            application: 'app',
            environment: 'test',
            version: '1.0.0'
          }
        },
        {
          provide: CPS_LIVE_ANNOUNCER_SERVICE,
          useValue: { announce, clear: jest.fn() }
        }
      ]
    }).compileComponents();
    monitor = TestBed.inject(CpsTelemetryMonitor);
    fixture = TestBed.createComponent(CpsDiagnosticsDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should open empty, with three sections and an explanation', () => {
    expect(titles()).toEqual([
      'BI telemetry · no events yet',
      'Scenario telemetry · no events yet',
      'Logging · no events yet'
    ]);
    expect(text()).toContain('Capturing from now.');
    expect(text()).toContain('No BI events since this window opened.');
  });

  it('should show events live, in the right section, with the right columns', () => {
    monitor.publish(bi('theme_changed'));
    monitor.publish(scenario);
    monitor.publish(warn);
    settle();

    expect(bodyRows()).toBe(3);
    expect(titles()[0]).toMatch(/^BI telemetry · 1 · last \d\d:\d\d:\d\d$/);
    expect(text()).toContain('theme_changed');
    expect(text()).toContain('theme=dark');
    expect(text()).toContain('load-dashboard');
    expect(text()).toContain('42 ms');
    expect(text()).toContain('Careful now');
    expect(text()).toContain('3 events');
  });

  it('should mark the newest rows as new', () => {
    monitor.publish(bi('a'));
    settle();
    expect(
      el().querySelector('td.cps-diagnostics-section__time cps-chip')
    ).not.toBeNull();
  });

  it('should show the full payload when a row is expanded', () => {
    monitor.publish(bi('theme_changed'));
    settle();

    (
      el().querySelector('button[aria-label="Expand row"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    const pre = el().querySelector('pre');
    expect(pre?.getAttribute('aria-label')).toMatch(/^Payload of event #\d+$/);
    expect(JSON.parse(pre?.textContent ?? '')).toMatchObject({
      eventName: 'theme_changed',
      metadata: { theme: 'dark' }
    });
    expect(text()).toContain('telemetry sink');
  });

  it('should filter one section without touching the others', () => {
    monitor.publish(bi('theme_changed', 'dark'));
    monitor.publish(bi('sidebar_toggled', 'light'));
    monitor.publish(warn);
    settle();

    const search = el().querySelector(
      'input[aria-label="Search BI telemetry events"]'
    ) as HTMLInputElement;
    search.value = 'dark';
    search.dispatchEvent(new Event('input'));
    jest.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(titles()[0]).toMatch(/^BI telemetry · 1 of 2/);
    // Logging has its own filters, still empty.
    expect(titles()[2]).toMatch(/^Logging · 1 · /);
    expect(text()).toContain('Careful now');
  });

  it('should give each section its own search field', () => {
    const labels = Array.from(
      el().querySelectorAll('.cps-diagnostics-search input')
    ).map((i) => i.getAttribute('aria-label'));
    expect(labels).toEqual([
      'Search BI telemetry events',
      'Search Scenario telemetry events',
      'Search Logging events'
    ]);
  });

  it('should clear history and keep capturing', () => {
    monitor.publish(bi('a'));
    settle();

    Array.from(el().querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Clear')
      ?.click();
    fixture.detectChanges();
    expect(bodyRows()).toBe(0);
    expect(announce).toHaveBeenCalledWith(
      'History cleared. Capturing continues.',
      'polite'
    );

    monitor.publish(bi('b'));
    settle();
    expect(bodyRows()).toBe(1);
  });

  it('should hold events back while paused, then show them on resume', () => {
    monitor.publish(bi('a'));
    settle();

    ui().setPaused(true);
    monitor.publish(bi('b'));
    settle();
    expect(bodyRows()).toBe(1);
    expect(text()).toContain('1 new event held back while paused.');

    ui().setPaused(false);
    fixture.detectChanges();
    expect(bodyRows()).toBe(2);
  });

  it("should download a section's own events, whatever its filters", () => {
    const download = jest
      .spyOn(exportUtil, 'cpsDownloadJson')
      .mockImplementation(() => undefined);
    monitor.publish(bi('a'));
    monitor.publish(bi('b'));
    monitor.publish(warn);
    settle();
    // A BI filter hiding one event must not remove it from BI's download.
    fixture.debugElement.injector
      .get(CpsDiagnosticsStore)
      .setText('bi', 'nothing matches this');
    fixture.detectChanges();

    button('Download BI telemetry').click();

    expect(download).toHaveBeenCalledTimes(1);
    const [, filename, json] = download.mock.calls[0];
    expect(filename).toMatch(
      /^cps-telemetry-diagnostics-app-bi-\d{8}-\d{6}\.json$/
    );
    const doc = JSON.parse(json);
    expect(doc).toMatchObject({
      format: 'cps-telemetry-diagnostics',
      section: 'bi',
      app: { application: 'app' },
      count: { captured: 2, droppedOldest: 0 },
      activeFilters: { text: 'nothing matches this' }
    });
    expect(doc.events.map((e: { kind: string }) => e.kind)).toEqual([
      'bi',
      'bi'
    ]);

    button('Download Logging').click();
    const logging = JSON.parse(download.mock.calls[1][2]);
    expect(logging.section).toBe('logging');
    expect(logging.events.map((e: { kind: string }) => e.kind)).toEqual([
      'log'
    ]);
  });

  it("should copy a section's own events as JSON", async () => {
    const writeText = jest.fn((_text: string) => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    monitor.publish(bi('a'));
    monitor.publish(warn);
    settle();

    button('Copy Logging').click();
    await Promise.resolve();

    const doc = JSON.parse(writeText.mock.calls[0][0]);
    expect(doc.section).toBe('logging');
    expect(doc.events).toHaveLength(1);
  });

  it('should announce new arrivals politely, at most every ten seconds', () => {
    monitor.publish(bi('a'));
    monitor.publish(bi('b'));
    monitor.publish(warn);
    settle();
    expect(announce).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10_000);
    expect(announce).toHaveBeenCalledWith(
      '3 new events: 2 BI, 1 log.',
      'polite'
    );

    announce.mockClear();
    jest.advanceTimersByTime(10_000);
    expect(announce).not.toHaveBeenCalled(); // nothing new
  });

  it('should produce no telemetry of its own while being used', () => {
    const seen: unknown[] = [];
    // Subscribe as a second observer, alongside the popup's own store.
    monitor.events$.subscribe((e) => seen.push(e));

    ui().clear();
    ui().setPaused(true);
    ui().setPaused(false);
    jest
      .spyOn(exportUtil, 'cpsDownloadJson')
      .mockImplementation(() => undefined);
    button('Download BI telemetry').click();
    button('Download Logging').click();
    settle();

    expect(seen).toHaveLength(0);
  });

  it('should stop observing when closed', () => {
    expect(monitor.observed).toBe(true);
    fixture.destroy();
    expect(monitor.observed).toBe(false);
  });
});
