import {
  inject,
  Injectable,
  InjectionToken,
  NgZone,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type CpsLiveAnnouncerPoliteness = 'polite' | 'assertive';

type RegionState = {
  el: HTMLElement;
  writeTimer: ReturnType<typeof setTimeout> | undefined;
  clearTimer: ReturnType<typeof setTimeout> | undefined;
};

/**
 * Service for making accessible live-region announcements without relying on a
 * specific component's live region. Creates two persistent hidden elements in
 * document.body (one polite, one assertive) that screen readers monitor for
 * content changes.
 */
@Injectable({ providedIn: 'root' })
export class CpsLiveAnnouncerService implements OnDestroy {
  private _document = inject(DOCUMENT);
  private _ngZone = inject(NgZone);
  private _platformId = inject(PLATFORM_ID);
  private _isBrowser = isPlatformBrowser(this._platformId);
  private _regions: Record<CpsLiveAnnouncerPoliteness, RegionState> = {
    polite: {
      el: this._createElement('polite'),
      writeTimer: undefined,
      clearTimer: undefined
    },
    assertive: {
      el: this._createElement('assertive'),
      writeTimer: undefined,
      clearTimer: undefined
    }
  };

  /**
   * Announces a message through the appropriate live region. Clears any
   * existing text first so the same message can be re-announced, then writes
   * the new text on the next tick so screen readers observe the content change.
   * After `duration` ms the region is cleared automatically; pass `0` to keep
   * the message indefinitely. Defaults to 5000ms.
   */
  announce(
    message: string,
    politeness: CpsLiveAnnouncerPoliteness = 'polite',
    durationMs = 5000
  ): void {
    if (!this._isBrowser) return;
    this.clear(politeness);
    const region = this._regions[politeness];
    this._ngZone.runOutsideAngular(() => {
      region.writeTimer = setTimeout(() => {
        region.writeTimer = undefined;
        region.el.textContent = message;
        if (durationMs > 0) {
          region.clearTimer = setTimeout(() => {
            region.clearTimer = undefined;
            region.el.textContent = '';
          }, durationMs);
        }
      });
    });
  }

  /**
   * Clears the live region without making a new announcement.
   */
  clear(politeness: CpsLiveAnnouncerPoliteness = 'polite'): void {
    if (!this._isBrowser) return;
    const region = this._regions[politeness];
    clearTimeout(region.writeTimer);
    clearTimeout(region.clearTimer);
    region.writeTimer = undefined;
    region.clearTimer = undefined;
    region.el.textContent = '';
  }

  ngOnDestroy(): void {
    for (const region of Object.values(this._regions)) {
      clearTimeout(region.writeTimer);
      clearTimeout(region.clearTimer);
      region.el.remove();
    }
  }

  private _createElement(politeness: CpsLiveAnnouncerPoliteness): HTMLElement {
    const cls = `cps-${politeness}-live-announcer-element`;
    if (this._isBrowser) {
      const existing = this._document.body.querySelector<HTMLElement>(
        `.${cls}`
      );
      if (existing) return existing;
    }

    const el = this._document.createElement('div');
    if (!this._isBrowser) return el;

    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.className = `cps-sr-only ${cls}`;
    this._document.body.appendChild(el);
    return el;
  }
}

/**
 * Injection token for the live-announcer service.
 *
 * By default it resolves to the singleton {@link CpsLiveAnnouncerService}.
 * Consumer applications can override it to supply a custom implementation or
 * provide `null` to disable all live-region announcements.
 *
 * @example Disable announcements:
 * ```typescript
 * providers: [{ provide: CPS_LIVE_ANNOUNCER_SERVICE, useValue: null }]
 * ```
 */
export const CPS_LIVE_ANNOUNCER_SERVICE =
  new InjectionToken<CpsLiveAnnouncerService | null>(
    'CpsLiveAnnouncerService',
    {
      providedIn: 'root',
      factory: () => inject(CpsLiveAnnouncerService)
    }
  );
