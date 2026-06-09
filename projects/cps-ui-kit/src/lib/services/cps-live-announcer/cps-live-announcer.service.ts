import { inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type CpsLiveAnnouncerPoliteness = 'polite' | 'assertive';

/**
 * Service for making accessible live-region announcements without relying on a
 * specific component's live region. Creates two persistent hidden elements in
 * document.body (one polite, one assertive) that screen readers monitor for
 * content changes.
 */
@Injectable({ providedIn: 'root' })
export class CpsLiveAnnouncerService implements OnDestroy {
  private _politeEl: HTMLElement;
  private _assertiveEl: HTMLElement;
  private _document = inject(DOCUMENT);
  private _politeTimer: ReturnType<typeof setTimeout> | undefined;
  private _assertiveTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this._politeEl = this._createElement('polite');
    this._assertiveEl = this._createElement('assertive');
  }

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
    const isAssertive = politeness === 'assertive';
    const el = isAssertive ? this._assertiveEl : this._politeEl;
    clearTimeout(isAssertive ? this._assertiveTimer : this._politeTimer);
    el.textContent = '';
    setTimeout(() => {
      el.textContent = message;
      if (durationMs > 0) {
        const timer = setTimeout(() => (el.textContent = ''), durationMs);
        if (isAssertive) this._assertiveTimer = timer;
        else this._politeTimer = timer;
      }
    });
  }

  /**
   * Clears the live region without making a new announcement.
   */
  clear(politeness: CpsLiveAnnouncerPoliteness = 'polite'): void {
    const isAssertive = politeness === 'assertive';
    clearTimeout(isAssertive ? this._assertiveTimer : this._politeTimer);
    (isAssertive ? this._assertiveEl : this._politeEl).textContent = '';
  }

  ngOnDestroy(): void {
    clearTimeout(this._politeTimer);
    clearTimeout(this._assertiveTimer);
    this._politeEl.remove();
    this._assertiveEl.remove();
  }

  private _createElement(politeness: CpsLiveAnnouncerPoliteness): HTMLElement {
    const cls = `cps-${politeness}-live-announcer-element`;
    const existing = this._document.body.querySelector<HTMLElement>(`.${cls}`);
    if (existing) return existing;
    const el = this._document.createElement('div');
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
