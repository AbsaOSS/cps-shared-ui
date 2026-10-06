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
  UWT_TELEMETRY_DIAGNOSTICS_CONFIG,
  UwtTelemetryDiagnosticsConfig
} from '../uwt-diagnostics.models/uwt-diagnostics.models';
import { UWT_DEFAULT_DIAGNOSTICS_CONFIG } from '../uwt-diagnostics-store/uwt-diagnostics-store';
import {
  UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS,
  uwtMatchesShortcut
} from '../uwt-diagnostics-shortcut/uwt-diagnostics-shortcut';
import { UwtDiagnosticsDialogComponent } from '../uwt-diagnostics-dialog/uwt-diagnostics-dialog.component';
import {
  uwtSafe,
  uwtSafeVoid
} from '../uwt-diagnostics-internal.util/uwt-diagnostics-internal.util';

/**
 * Opens and closes the telemetry diagnostics popup, and listens for its
 * keyboard shortcut once {@link provideUwtTelemetryDiagnostics} installs it.
 *
 * The popup is non-modal: the application stays usable while events
 * arrive. With the popup open, the shortcut returns focus to it from the
 * application, and closes it when focus is already inside.
 *
 * @example
 * ```typescript
 * // From an app's own "Support" menu, when the shortcut is disabled:
 * inject(UwtTelemetryDiagnosticsService).open();
 * ```
 *
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class UwtTelemetryDiagnosticsService {
  private readonly dialogs = inject(CpsDialogService);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly config: UwtTelemetryDiagnosticsConfig = {
    ...UWT_DEFAULT_DIAGNOSTICS_CONFIG,
    shortcuts: UWT_DEFAULT_DIAGNOSTICS_SHORTCUTS,
    ...inject(UWT_TELEMETRY_DIAGNOSTICS_CONFIG, { optional: true })
  };

  private readonly enabled = uwtSafe(
    'enabled',
    () =>
      typeof this.config.enabled === 'function'
        ? this.config.enabled()
        : this.config.enabled,
    false
  );

  private ref?: CpsDialogRef<UwtDiagnosticsDialogComponent>;
  private installed = false;

  /** Whether the popup is currently open. */
  readonly isOpen = signal(false);

  /**
   * Starts listening for the shortcut. Called by
   * {@link provideUwtTelemetryDiagnostics}; does nothing on the server,
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
      uwtSafeVoid('shortcut', () => {
        if (!this.config.shortcuts.some((s) => uwtMatchesShortcut(event, s))) {
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
    uwtSafeVoid('open', () => {
      const ref: CpsDialogRef<UwtDiagnosticsDialogComponent> =
        this.dialogs.open(UwtDiagnosticsDialogComponent, {
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
          autoFocus: '.uwt-diagnostics-search input'
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
    uwtSafeVoid('close', () => this.ref?.close());
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
