import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  inject,
  Injectable,
  InjectionToken,
  OnDestroy,
  PLATFORM_ID,
  signal,
  Signal
} from '@angular/core';

/**
 * CpsRootFontSizeService tracks the application's current root font size.
 *
 * The service uses a ResizeObserver strategy to reliably detect root font-size changes:
 *
 * **Sentinel element** (`<div style="width:1rem;height:0">`) — its pixel width
 *    mirrors `1rem`. Any root font-size change — caused by CSS class toggles,
 *    stylesheet rules, direct JS assignment, or viewport resize (e.g.
 *    `font-size: 1.5vw`) — changes the sentinel's computed width, firing the
 *    observer.
 * The cached value is stored in a signal and is only updated when the actual
 * font-size value changes, preventing spurious updates.
 *
 * In microfrontend environments the sentinel element is keyed by a known DOM
 * attribute (`data-cps-root-font-size-sentinel`) and reused if already present,
 * so only one sentinel node exists per document regardless of how many
 * instances of this service are created.
 *
 * Only active in browser environments. Under SSR the `fontSize` signal is
 * initialized to `16` (the standard browser default) and no DOM observers are created.
 *
 * Prefer injecting {@link CPS_ROOT_FONT_SIZE_SERVICE} over this class directly
 * to allow consumer applications to override the behavior.
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   private fontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);
 *   readonly fontSize = this.fontSizeService?.fontSize;
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CpsRootFontSizeService implements OnDestroy {
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);

  private static readonly _SENTINEL_ATTR = 'data-cps-root-font-size-sentinel';

  private readonly _fontSize = signal<number>(
    isPlatformBrowser(this._platformId) ? this._readRootFontSize() : 16
  );

  private _sentinel: HTMLElement | null = null;
  private _sentinelOwned = false;
  private _sentinelObserver: ResizeObserver | null = null;

  /** Reactive signal containing the current root font size in pixels. */
  readonly fontSize: Signal<number> = this._fontSize.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this._platformId)) return;
    this._setupObservers();
  }

  ngOnDestroy(): void {
    this._sentinelObserver?.disconnect();

    if (this._sentinelOwned && this._sentinel) {
      this._sentinel.remove();
    }

    this._sentinelObserver = null;
    this._sentinel = null;
  }

  private _setupObservers(): void {
    // Reuse an existing sentinel if another service instance already created one.
    let sentinel = this._document.querySelector<HTMLElement>(
      `[${CpsRootFontSizeService._SENTINEL_ATTR}]`
    );

    if (!sentinel) {
      sentinel = this._document.createElement('div');
      sentinel.setAttribute(CpsRootFontSizeService._SENTINEL_ATTR, '');
      Object.assign(sentinel.style, {
        position: 'absolute',
        width: '1rem',
        height: '0',
        visibility: 'hidden',
        pointerEvents: 'none',
        userSelect: 'none',
        top: '0',
        left: '0'
      });
      this._document.documentElement.appendChild(sentinel);
      this._sentinelOwned = true;
    }

    this._sentinel = sentinel;

    this._sentinelObserver = new ResizeObserver(() => this._refresh());
    this._sentinelObserver.observe(sentinel);
  }

  private _refresh(): void {
    const newSize = this._readRootFontSize();
    if (newSize !== this._fontSize()) {
      this._fontSize.set(newSize);
    }
  }

  private _readRootFontSize(): number {
    return parseFloat(
      getComputedStyle(this._document.documentElement).fontSize
    );
  }
}

/**
 * Injection token for the root font size service.
 *
 * By default it resolves to the singleton {@link CpsRootFontSizeService}.
 * Consumer applications can override it to:
 * - Supply a custom subclass
 * - Provide `null` to disable dynamic tracking entirely
 *
 * @example Disable dynamic tracking:
 * ```typescript
 * providers: [
 *   { provide: CPS_ROOT_FONT_SIZE_SERVICE, useValue: null }
 * ]
 * ```
 */
export const CPS_ROOT_FONT_SIZE_SERVICE =
  new InjectionToken<CpsRootFontSizeService | null>('CpsRootFontSizeService', {
    providedIn: 'root',
    factory: () => inject(CpsRootFontSizeService)
  });
