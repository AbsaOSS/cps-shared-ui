import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject
} from '@angular/core';
import {
  CPS_LIVE_ANNOUNCER_SERVICE,
  CpsButtonComponent,
  CpsSwitchComponent
} from 'cps-ui-kit';
import { UWT_TELEMETRY_DIAGNOSTICS_CONFIG } from '../uwt-diagnostics.models/uwt-diagnostics.models';
import {
  UWT_DEFAULT_DIAGNOSTICS_CONFIG,
  UWT_DIAGNOSTICS_SECTIONS,
  UwtDiagnosticsStore
} from '../uwt-diagnostics-store/uwt-diagnostics-store';
import { UwtDiagnosticsSectionComponent } from '../uwt-diagnostics-section/uwt-diagnostics-section.component';
import {
  UWT_DIAGNOSTICS_SECTION_NOUN,
  UwtDiagnosticsExporter
} from '../uwt-diagnostics-export/uwt-diagnostics-exporter';
import { uwtDiagnosticsTime } from '../uwt-diagnostics-section/uwt-diagnostics-columns';
import {
  UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS,
  uwtIsApplePlatform,
  uwtShortcutLabel
} from '../uwt-diagnostics-shortcut/uwt-diagnostics-shortcut';

/** Screen readers hear about new events at most this often, in ms. */
const ANNOUNCE_EVERY_MS = 10_000;

/**
 * The diagnostics popup's content, opened by
 * {@link UwtTelemetryDiagnosticsService} inside a non-modal cps-dialog.
 * Capturing is controlled here — pause and clear apply to everything —
 * while each section filters, downloads and copies its own events.
 *
 * Owns its {@link UwtDiagnosticsStore}, so the captured history lives
 * exactly as long as this window: it starts empty and is discarded on
 * close. Uses no telemetry service itself, so opening or using it never
 * produces events of its own.
 */
@Component({
  selector: 'uwt-diagnostics-dialog',
  imports: [
    CpsButtonComponent,
    CpsSwitchComponent,
    UwtDiagnosticsSectionComponent
  ],
  providers: [UwtDiagnosticsStore, UwtDiagnosticsExporter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './uwt-diagnostics-dialog.component.html',
  styleUrl: './uwt-diagnostics-dialog.component.scss'
})
export class UwtDiagnosticsDialogComponent {
  protected readonly store = inject(UwtDiagnosticsStore);

  private readonly document = inject(DOCUMENT);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly announcer = inject(CPS_LIVE_ANNOUNCER_SERVICE, {
    optional: true
  });

  private readonly config = {
    ...UWT_DEFAULT_DIAGNOSTICS_CONFIG,
    shortcuts: UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS,
    ...inject(UWT_TELEMETRY_DIAGNOSTICS_CONFIG, { optional: true })
  };

  protected readonly sections = UWT_DIAGNOSTICS_SECTIONS;
  protected readonly maxPayloadChars = this.config.maxPayloadCharsInView;

  protected readonly since = computed(() =>
    uwtDiagnosticsTime(this.store.startedAt()).slice(0, 8)
  );

  protected readonly shortcut = uwtShortcutLabel(
    this.config.shortcuts,
    uwtIsApplePlatform(this.document.defaultView?.navigator)
  );

  private lastAnnounced = { bi: 0, scenario: 0, logging: 0 };

  constructor() {
    const timer = setInterval(() => this.announceNew(), ANNOUNCE_EVERY_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Whether keyboard focus is anywhere in the popup, header included. */
  containsFocus(): boolean {
    const dialog = this.dialogElement();
    return !!dialog && dialog.contains(this.document.activeElement);
  }

  /** Moves focus to the search field. */
  focusSearch(): void {
    const input = this.host.nativeElement.querySelector<HTMLInputElement>(
      '.uwt-diagnostics-search input'
    );
    (input ?? this.dialogElement())?.focus();
  }

  protected setPaused(paused: boolean): void {
    this.store.setPaused(paused);
    this.announce(
      paused
        ? 'Live updates paused. Events are still captured.'
        : 'Live updates resumed.'
    );
  }

  protected clear(): void {
    this.store.clear();
    this.lastAnnounced = { bi: 0, scenario: 0, logging: 0 };
    this.announce('History cleared. Capturing continues.');
  }

  /** One polite summary of what arrived since the last one, if anything. */
  private announceNew(): void {
    if (this.store.paused()) {
      return;
    }
    const received = this.store.received();
    const parts = UWT_DIAGNOSTICS_SECTIONS.map((id) => ({
      id,
      n: received[id] - this.lastAnnounced[id]
    })).filter((p) => p.n > 0);
    this.lastAnnounced = { ...received };
    if (parts.length === 0) {
      return;
    }
    const total = parts.reduce((sum, p) => sum + p.n, 0);
    const detail = parts
      .map((p) => `${p.n} ${UWT_DIAGNOSTICS_SECTION_NOUN[p.id]}`)
      .join(', ');
    this.announce(`${total} new event${total === 1 ? '' : 's'}: ${detail}.`);
  }

  private announce(message: string): void {
    try {
      this.announcer?.announce(message, 'polite');
    } catch {
      // Announcements are a courtesy; never let one break the popup.
    }
  }

  private dialogElement(): HTMLElement | null {
    return this.host.nativeElement.closest<HTMLElement>('[role="dialog"]');
  }
}
