import {
  inject,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * CpsFocusService manages focus-related concerns:
 * - Tracks the most recent user input modality (keyboard vs. pointer)
 * - Focuses elements with conditional focus-ring suppression
 * - Traps focus within a container (e.g. a modal dialog)
 *
 * Only active in browser environments; no-ops under SSR.
 *
 * @example
 * ```ts
 * readonly focusService = inject(CpsFocusService);
 * readonly showFocusRing = computed(() => this.focusService.isKeyboard());
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CpsFocusService {
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

  /**
   * Returns `true` when the most recently detected input was keyboard.
   * Shorthand for `lastInput() === 'keyboard'`.
   */
  isKeyboard(): boolean {
    return this.lastInput() === 'keyboard';
  }

  /**
   * Focuses `el`, conditionally suppressing the focus-visible ring.
   *
   * When `showFocusRing` is `false`, adds the `suppress-focus-visible` CSS
   * class to the element before focusing and removes it on the next `blur`
   * event. This keeps the UI clean for pointer-initiated closes.
   */
  focusElement(el: HTMLElement, showFocusRing: boolean): void {
    if (!showFocusRing) {
      el.classList.add('suppress-focus-visible');
      el.addEventListener(
        'blur',
        () => el.classList.remove('suppress-focus-visible'),
        { once: true }
      );
    }
    el.focus();
  }

  /**
   * Installs a Tab key focus trap on `container`.
   *
   * @param container - The element to trap focus within.
   * @param getFocusableElements - Returns the ordered list of tabbable
   *   elements inside `container`. Defaults to a native CSS-selector-based
   *   implementation. Pass `DomHandler.getFocusableElements` (PrimeNG) or any
   *   custom function when richer querying is needed.
   * @returns A teardown function — call it to remove the trap listener.
   */
  trapFocus(
    container: HTMLElement,
    getFocusableElements: (
      el: HTMLElement
    ) => HTMLElement[] = _defaultGetFocusableElements
  ): () => void {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (!focusable || focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = this._document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === container) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || active === container) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }

  private readonly _navigationKeys = new Set([
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

  constructor() {
    if (!isPlatformBrowser(this._platformId)) return;

    this._document.addEventListener('keydown', (e) => {
      if (this._navigationKeys.has(e.key)) {
        this.lastInput.set('keyboard');
      }
    });

    this._document.addEventListener('pointerdown', () => {
      this.lastInput.set('pointer');
    });
  }
}

const _FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]',
  '[contenteditable="true"]'
]
  .map((s) => `${s}:not([tabindex="-1"]):not([disabled]):not([hidden])`)
  .join(',');

function _defaultGetFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(_FOCUSABLE_SELECTOR)
  ).filter((el) => {
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Injection token for the focus managing service.
 *
 * By default it resolves to the singleton {@link CpsFocusService}.
 * Consumer applications can override it to:
 * - Supply a custom subclass
 * - Provide `null` to disable dynamic tracking entirely
 *
 * @example Disable dynamic tracking:
 * ```typescript
 * providers: [
 *   { provide: CPS_FOCUS_SERVICE, useValue: null }
 * ]
 * ```
 */
export const CPS_FOCUS_SERVICE = new InjectionToken<CpsFocusService | null>(
  'CpsFocusService',
  {
    providedIn: 'root',
    factory: () => inject(CpsFocusService)
  }
);
