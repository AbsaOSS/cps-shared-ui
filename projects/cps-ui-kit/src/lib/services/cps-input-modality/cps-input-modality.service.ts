import {
  inject,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * Tracks the most recent user input modality (keyboard vs. pointer) by
 * listening to `keydown` and `pointerdown` events on the document.
 *
 * Useful for conditionally showing focus rings only when the user is navigating
 * via keyboard, keeping the UI clean for pointer users.
 *
 * Only active in browser environments; no-ops under SSR.
 *
 * @example
 * ```ts
 * readonly inputModality = inject(CpsInputModalityService);
 * readonly showFocusRing = computed(() => this.inputModality.lastInput() === 'keyboard');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CpsInputModalityService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);

  /**
   * A signal reflecting the most recently detected input modality.
   * - `'keyboard'` — set when a navigation key (Tab, Enter, Space, Arrow keys,
   *   Home, End, PageUp, PageDown) is pressed.
   * - `'pointer'` — set on every `pointerdown` event (mouse, touch, stylus).
   *
   * Defaults to `'pointer'`.
   */
  readonly lastInput = signal<'keyboard' | 'pointer'>('pointer');

  constructor() {
    if (!isPlatformBrowser(this._platformId)) return;

    this._document.addEventListener('keydown', (e) => {
      const navigationKeys = new Set([
        'Tab',
        'Enter',
        ' ',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown'
      ]);
      if (navigationKeys.has(e.key)) {
        this.lastInput.set('keyboard');
      }
    });

    this._document.addEventListener('pointerdown', () => {
      this.lastInput.set('pointer');
    });
  }
}

export const CPS_INPUT_MODALITY_SERVICE =
  new InjectionToken<CpsInputModalityService | null>(
    'CpsInputModalityService',
    {
      providedIn: 'root',
      factory: () => inject(CpsInputModalityService)
    }
  );
