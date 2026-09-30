import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  inject,
  Injectable,
  NgZone,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { CpsDialogRef, CpsDialogService } from 'cps-ui-kit';
import {
  CPS_TELEMETRY_DIAGNOSTICS_CONFIG,
  CpsTelemetryDiagnosticsConfig
} from '../cps-diagnostics.models/cps-diagnostics.models';
import { CPS_DEFAULT_DIAGNOSTICS_CONFIG } from '../cps-diagnostics-store/cps-diagnostics-store';
import {
  CPS_DEFAULT_DIAGNOSTICS_SHORTCUTS,
  cpsMatchesShortcut
} from '../cps-diagnostics-shortcut/cps-diagnostics-shortcut';
import { CpsDiagnosticsDialogComponent } from '../cps-diagnostics-dialog/cps-diagnostics-dialog.component';
import {
  cpsSafe,
  cpsSafeVoid
} from '../cps-diagnostics-internal.util/cps-diagnostics-internal.util';

/**
 * Opens and closes the telemetry diagnostics popup, and listens for its
 * keyboard shortcut once {@link provideCpsTelemetryDiagnostics} installs it.
 *
 * The popup is non-modal: the application stays usable while events
 * arrive. With the popup open, the shortcut returns focus to it from the
 * application, and closes it when focus is already inside.
 *
 * @example
 * ```typescript
 * // From an app's own "Support" menu, when the shortcut is disabled:
 * inject(CpsTelemetryDiagnosticsService).open();
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsTelemetryDiagnosticsService {
  private readonly dialogs = inject(CpsDialogService);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly config: CpsTelemetryDiagnosticsConfig = {
    ...CPS_DEFAULT_DIAGNOSTICS_CONFIG,
    shortcuts: CPS_DEFAULT_DIAGNOSTICS_SHORTCUTS,
    ...inject(CPS_TELEMETRY_DIAGNOSTICS_CONFIG, { optional: true })
  };

  private readonly enabled = cpsSafe(
    'enabled',
    () =>
      typeof this.config.enabled === 'function'
        ? this.config.enabled()
        : this.config.enabled,
    false
  );

  private ref?: CpsDialogRef<CpsDiagnosticsDialogComponent>;
  private installed = false;

  /** Whether the popup is currently open. */
  readonly isOpen = signal(false);

  /**
   * Starts listening for the shortcut. Called by
   * {@link provideCpsTelemetryDiagnostics}; does nothing on the server,
   * when disabled, with no shortcuts, or when already listening.
   */
  install(): void {
    if (
      this.installed ||
      !this.isBrowser ||
      !this.enabled ||
      this.config.shortcuts.length === 0
    ) {
      return;
    }
    this.installed = true;

    const listener = (event: KeyboardEvent) =>
      cpsSafeVoid('shortcut', () => {
        if (!this.config.shortcuts.some((s) => cpsMatchesShortcut(event, s))) {
          return;
        }
        event.preventDefault();
        this.zone.run(() => this.onShortcut());
      });

    // Capture phase, so it works even where a component stops propagation.
    // Outside Angular's zone, so ordinary typing triggers no change detection.
    this.zone.runOutsideAngular(() =>
      this.document.addEventListener('keydown', listener, true)
    );
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('keydown', listener, true);
      this.close();
    });
  }

  /** Opens the popup, or moves focus into it when already open. */
  open(): void {
    if (!this.enabled || !this.isBrowser) {
      return;
    }
    if (this.ref) {
      this.ref.componentInstance?.focusSearch();
      return;
    }
    cpsSafeVoid('open', () => {
      const ref: CpsDialogRef<CpsDiagnosticsDialogComponent> =
        this.dialogs.open(CpsDiagnosticsDialogComponent, {
          headerTitle: 'Telemetry diagnostics',
          ariaLabel: 'Telemetry diagnostics',
          modal: false,
          draggable: true,
          resizable: true,
          maximizable: true,
          closeOnEscape: true,
          // Docked right at half the screen, so the application stays
          // visible and clickable beside it; resizable, and maximizable
          // for a closer look.
          position: 'right',
          width: 'min(64rem, 50vw)',
          height: '88vh',
          minWidth: 'min(22rem, 96vw)',
          autoFocus: '.cps-diagnostics-search input'
        });
      this.ref = ref;
      this.isOpen.set(true);
      ref.onDestroy.subscribe(() => {
        if (this.ref === ref) {
          this.ref = undefined;
          this.isOpen.set(false);
        }
      });
    });
  }

  /** Closes the popup, discarding what it captured. */
  close(): void {
    cpsSafeVoid('close', () => this.ref?.close());
  }

  /**
   * What the shortcut does: open when closed; with the popup open, close
   * it if focus is inside, otherwise bring focus back to it.
   */
  toggle(): void {
    if (!this.ref) {
      this.open();
    } else if (this.ref.componentInstance?.containsFocus()) {
      this.close();
    } else {
      this.ref.componentInstance?.focusSearch();
    }
  }

  private onShortcut(): void {
    this.toggle();
  }
}
