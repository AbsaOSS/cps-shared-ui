import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsTelemetryMonitor } from 'cps-telemetry';
import { CpsDiagnosticsExporter } from '../cps-diagnostics-export/cps-diagnostics-exporter';
import {
  CPS_DIAGNOSTICS_FLUSH_MS,
  CpsDiagnosticsStore
} from '../cps-diagnostics-store/cps-diagnostics-store';
import { CpsDiagnosticsSectionComponent } from './cps-diagnostics-section.component';

/** Rows per page, as the section's table is configured. */
const PAGE = 25;

describe('CpsDiagnosticsSectionComponent', () => {
  let fixture: ComponentFixture<CpsDiagnosticsSectionComponent>;
  let store: CpsDiagnosticsStore;
  let monitor: CpsTelemetryMonitor;

  const el = () => fixture.nativeElement as HTMLElement;
  const shownRows = () =>
    el().querySelectorAll('td.cps-diagnostics-section__time').length;
  const pageReport = () =>
    el().querySelector('.p-paginator-current')?.textContent?.trim();
  const ui = () =>
    fixture.componentInstance as unknown as {
      first(): number;
      onPage(state: { first?: number }): void;
    };

  /** Publishes BI events, every tenth one named `needle`. */
  function publish(count: number): void {
    for (let i = 0; i < count; i++) {
      monitor.publish({
        kind: 'bi',
        eventType: 'com.cps.bi',
        payload: {
          eventName: i % 10 === 0 ? 'needle' : `hay-${i}`,
          eventTime: '2026-01-01T00:00:00.000Z',
          application: 'app'
        },
        destination: 'sink',
        origin: { forwarded: false }
      });
    }
    jest.advanceTimersByTime(CPS_DIAGNOSTICS_FLUSH_MS);
    fixture.detectChanges();
  }

  function goToPage(page: number): void {
    ui().onPage({ first: (page - 1) * PAGE });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [CpsDiagnosticsSectionComponent, NoopAnimationsModule],
      providers: [CpsDiagnosticsStore, CpsDiagnosticsExporter]
    }).compileComponents();
    monitor = TestBed.inject(CpsTelemetryMonitor);
    store = TestBed.inject(CpsDiagnosticsStore);
    fixture = TestBed.createComponent(CpsDiagnosticsSectionComponent);
    fixture.componentRef.setInput('section', 'bi');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
  });

  describe('paging', () => {
    it('should show the page the reader chose', () => {
      publish(100);
      goToPage(4);

      expect(ui().first()).toBe(75);
      expect(shownRows()).toBe(PAGE);
    });

    it('should stay on the page while new events arrive', () => {
      publish(100);
      goToPage(2);

      publish(1);

      expect(ui().first()).toBe(PAGE);
    });

    it('should go back to the first page when a filter leaves fewer rows than the page starts at', () => {
      publish(100);
      goToPage(4);

      store.setText('bi', 'needle');
      fixture.detectChanges();

      expect(ui().first()).toBe(0);
      expect(shownRows()).toBe(10);
      expect(pageReport()).toBe('1 - 10 of 10');
    });

    it('should keep the page when a filter still reaches it', () => {
      publish(100);
      goToPage(2);

      store.setText('bi', 'hay');
      fixture.detectChanges();

      expect(ui().first()).toBe(PAGE);
      expect(shownRows()).toBe(PAGE);
    });

    it('should go back to the first page when the section is cleared', () => {
      publish(100);
      goToPage(3);

      store.clear();
      fixture.detectChanges();
      expect(ui().first()).toBe(0);

      publish(1);
      expect(shownRows()).toBe(1);
      expect(pageReport()).toBe('1 - 1 of 1');
    });
  });
});
