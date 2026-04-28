import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  SecurityContext
} from '@angular/core';
import { convertSize, parseSize } from '../../utils/internal/size-utils';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { generateUniqueId } from '../../utils/internal/accessibility-utils';

/**
 * CpsTooltipPosition is used to define the position of the tooltip.
 * @group Types
 */
export type CpsTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * CpsTooltipOpenOn is used to define the event on which the tooltip should open.
 * @group Types
 */
export type CpsTooltipOpenOn = 'hover' | 'click' | 'focus';

/**
 * CpsTooltipDirective provides advisory information for a target element.
 * @group Components
 */
@Directive({
  selector: '[cpsTooltip]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.tab)': 'onTabFromTrigger($event)',
    '(click)': 'onClick()',
    '(document:click)': 'onDocumentClick($event.target)',
    '(window:resize)': 'onPageResize($event)'
  }
})
export class CpsTooltipDirective implements OnInit, OnDestroy {
  /**
   * Tooltip text or html to show.
   * @group Props
   */
  readonly tooltip = input.required<string>({ alias: 'cpsTooltip' });

  /**
   * Delay to show the tooltip in milliseconds, it can be of type string or number.
   * @group Props
   * @default 300
   */
  readonly tooltipOpenDelay = input<string | number>(300);

  /**
   * Delay to hide the tooltip in milliseconds, it can be of type string or number.
   * @group Props
   * @default 300
   */
  readonly tooltipCloseDelay = input<string | number>(300);

  /**
   * Determines whether the tooltip should open on hover, click or focus.
   * @group Props
   * @default hover
   */
  readonly tooltipOpenOn = input<CpsTooltipOpenOn>('hover');

  /**
   * Position of the tooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   * @default top
   */
  readonly tooltipPosition = input<CpsTooltipPosition>('top');

  /**
   * Determines whether the tooltip is persistent.
   * @group Props
   * @default false
   */
  readonly tooltipPersistent = input(false);

  /**
   * When present, it specifies that the tooltip should be disabled.
   * @group Props
   * @default false
   */
  readonly tooltipDisabled = input(false);

  /**
   * Max width of the tooltip of type number denoting pixels or string.
   * @group Props
   * @default 100%
   */
  readonly tooltipMaxWidth = input<number | string>('100%');

  /**
   * Tooltip content class for styling.
   * @group Props
   * @default cps-tooltip-content
   */
  readonly tooltipContentClass = input('cps-tooltip-content');

  /**
   * Tooltip offset, a number denoting pixels or a string.
   * @group Props
   * @default 0.5rem
   */
  readonly tooltipOffset = input<number | string>('0.5rem');

  readonly cvtTooltipOffset = computed(() => convertSize(this.tooltipOffset()));
  private _popup?: HTMLDivElement;
  private _showTimeout?: ReturnType<typeof setTimeout>;
  private _hideTimeout?: ReturnType<typeof setTimeout>;
  private _ariaTarget?: HTMLElement;

  private readonly _tooltipId = generateUniqueId('cps-tooltip');
  private _rootFontSizePx = 16;
  private window: Window;

  private _elementRef = inject(ElementRef<HTMLElement>);
  private _document = inject(DOCUMENT);
  private _domSanitizer = inject(DomSanitizer);

  constructor() {
    this.window = this._document.defaultView as Window;
  }

  ngOnInit(): void {
    this._rootFontSizePx = parseFloat(
      getComputedStyle(this._document.documentElement).fontSize || '16'
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this._showTimeout);
    clearTimeout(this._hideTimeout);
    this.window.removeEventListener('scroll', this._destroyTooltip, true);
    this._popup?.remove();
  }

  onMouseEnter() {
    if (this.tooltipOpenOn() === 'hover') {
      clearTimeout(this._hideTimeout);
      this._showTimeout = setTimeout(() => {
        this._createTooltip();
        this._positionAndShow();
      }, this.tooltipOpenDelay() as number);
    }
  }

  onMouseLeave() {
    clearTimeout(this._showTimeout);

    if (!this.tooltipPersistent()) {
      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.tooltipCloseDelay() as number
      );
    }
  }

  // Popup created synchronously so SR resolves aria-describedby on focus.
  // Visual appearance is delayed by tooltipOpenDelay.
  onFocus() {
    if (this.tooltipOpenOn() === 'hover' || this.tooltipOpenOn() === 'focus') {
      this._ariaTarget = this._resolveAriaTarget();
      clearTimeout(this._hideTimeout);
      clearTimeout(this._showTimeout);
      this._createTooltip();
      this._showTimeout = setTimeout(
        this._positionAndShow,
        this.tooltipOpenDelay() as number
      );
    }
  }

  onFocusOut(event: FocusEvent) {
    clearTimeout(this._showTimeout);
    if (!this._popup?.contains(event.relatedTarget as Node)) {
      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.tooltipCloseDelay() as number
      );
    }
  }

  // Tab from the trigger moves focus into the persistent tooltip instead of
  // the next page element, so keyboard users can interact with tooltip content.
  onTabFromTrigger(event: Event) {
    if (!this.tooltipPersistent() || !this._popup) return;
    const focusable = this._focusableIn(this._popup);
    if (!focusable.length) return;
    event.preventDefault();
    focusable[0].focus();
  }

  onClick() {
    if (this.tooltipOpenOn() === 'click') {
      this._ariaTarget = this._resolveAriaTarget();
      clearTimeout(this._hideTimeout);
      this._createTooltip();
      this._positionAndShow();
      this._announce(this._popup?.textContent ?? '');
    }
  }

  onDocumentClick(target: EventTarget | null) {
    if (this.tooltipPersistent() && this._popup) {
      const el = target as HTMLElement | null;
      if (!el?.isConnected) return;
      const clickedInside =
        this._elementRef.nativeElement.contains(el) || this._popup.contains(el);
      if (!clickedInside) {
        this._destroyTooltip();
      }
    }
  }

  onPageResize(event: Event) {
    if (this._popup) this._destroyTooltip(event);
  }

  private _createTooltip = () => {
    if (this._popup || this.tooltipDisabled()) return;

    this._popup = this._document.createElement('div');
    const popupContent = this._document.createElement('div');
    popupContent.innerHTML =
      this._domSanitizer.sanitize(SecurityContext.HTML, this.tooltip()) ||
      'Add your text to this tooltip';
    popupContent.className = this.tooltipContentClass();
    this._popup.appendChild(popupContent);
    this._popup.classList.add('cps-tooltip');
    this._popup.style.maxWidth = convertSize(this.tooltipMaxWidth());
    this._popup.setAttribute('role', 'tooltip');
    this._popup.id = this._tooltipId;
    this._document.body.appendChild(this._popup);
    this._ariaTarget?.setAttribute('aria-describedby', this._tooltipId);
  };

  private _positionAndShow = () => {
    if (!this._popup) return;

    const coords = this._getCoords();
    if (!coords) {
      this._destroyTooltip();
      return;
    }

    this._popup.style.left = `${this._pxToRem(coords.left)}rem`;
    this._popup.style.top = `${this._pxToRem(coords.top)}rem`;
    requestAnimationFrame(() => {
      if (this._popup) this._popup.style.opacity = '1';
    });

    if (this.tooltipPersistent()) {
      this._popup.addEventListener('focusout', this._onPopupFocusOut);
      this._popup.addEventListener('keydown', this._onPopupKeydown);
    }

    this.window.addEventListener('scroll', this._destroyTooltip, true);
  };

  private _destroyTooltip = (event?: Event) => {
    this.window.removeEventListener('scroll', this._destroyTooltip, true);
    if (!this._popup) return;

    this._popup.removeEventListener('focusout', this._onPopupFocusOut);
    this._popup.removeEventListener('keydown', this._onPopupKeydown);

    const popup = this._popup;
    this._popup = undefined;
    this._ariaTarget?.removeAttribute('aria-describedby');
    this._ariaTarget = undefined;

    if (event) {
      popup.remove();
    } else {
      popup.style.opacity = '0';
      setTimeout(() => popup.remove(), 200);
    }
  };

  private _isInsideScreen(
    coords: { left: number; top: number },
    popupRect: DOMRect
  ): boolean {
    return (
      coords.top >= 0 &&
      coords.left >= 0 &&
      coords.left + popupRect.width <= this.window.innerWidth &&
      coords.top + popupRect.height <= this.window.innerHeight
    );
  }

  private _pxToRem(px: number): number {
    return px / this._rootFontSizePx;
  }

  private _getOffsetPx(): number {
    const { value, unit } = parseSize(this.cvtTooltipOffset());
    if (unit === 'px') return value;
    if (unit === 'rem') return value * this._rootFontSizePx;
    if (unit === 'em')
      return (
        value *
        parseFloat(
          getComputedStyle(this._elementRef.nativeElement).fontSize || '16'
        )
      );
    throw new Error(`Unsupported unit "${unit}" for tooltipOffset.`);
  }

  private _getCoords(): { left: number; top: number } | undefined {
    if (!this._popup) return undefined;

    let positions: CpsTooltipPosition[] = ['top', 'bottom', 'left', 'right'];
    positions = positions.filter((item) => item !== this.tooltipPosition());
    positions.unshift(this.tooltipPosition());

    const targetEl = this._elementRef.nativeElement;
    const targetElRect = targetEl.getBoundingClientRect();
    const popupRect = this._popup.getBoundingClientRect();

    for (const pos of positions) {
      const coords = this._getCoordsForPosition(
        pos as CpsTooltipPosition,
        targetEl,
        targetElRect,
        popupRect
      );

      if (this._isInsideScreen(coords, popupRect)) {
        return coords;
      }
    }

    return undefined;
  }

  private _getCoordsForPosition(
    position: CpsTooltipPosition,
    targetEl: HTMLElement,
    targetElRect: DOMRect,
    popupRect: DOMRect
  ): {
    left: number;
    top: number;
  } {
    switch (position) {
      case 'bottom':
        return {
          left:
            targetElRect.left +
            this.window.scrollX +
            (targetEl.offsetWidth - popupRect.width) / 2,
          top: targetElRect.bottom + this.window.scrollY + this._getOffsetPx()
        };
      case 'left':
        return {
          left:
            targetElRect.left -
            this.window.scrollX -
            popupRect.width -
            this._getOffsetPx(),
          top:
            targetElRect.top +
            this.window.scrollY +
            (targetEl.offsetHeight - popupRect.height) / 2
        };
      case 'right':
        return {
          left: targetElRect.right + this.window.scrollX + this._getOffsetPx(),
          top:
            targetElRect.top +
            this.window.scrollY +
            (targetEl.offsetHeight - popupRect.height) / 2
        };
      default:
        return {
          left:
            targetElRect.left +
            this.window.scrollX +
            (targetEl.offsetWidth - popupRect.width) / 2,
          top:
            targetElRect.top +
            this.window.scrollY -
            popupRect.height -
            this._getOffsetPx()
        };
    }
  }

  private _focusableIn(el: HTMLElement): HTMLElement[] {
    const result: HTMLElement[] = [];
    const walker = this._document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const child = node as HTMLElement;
      if (child.tabIndex >= 0 && !(child as HTMLInputElement).disabled) {
        result.push(child);
      }
      node = walker.nextNode();
    }
    return result;
  }

  private _onPopupKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !this._popup) return;
    const focusable = this._focusableIn(this._popup);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this._document.activeElement;
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      const next = this._getNextFocusableAfterTrigger();
      next ? next.focus() : this._ariaTarget?.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      this._ariaTarget?.focus();
    }
  };

  private _getNextFocusableAfterTrigger(): HTMLElement | null {
    const all: HTMLElement[] = [];
    const walker = this._document.createTreeWalker(
      this._document.body,
      NodeFilter.SHOW_ELEMENT
    );
    let node = walker.nextNode();
    while (node) {
      const el = node as HTMLElement;
      if (
        el.tabIndex >= 0 &&
        !(el as HTMLInputElement).disabled &&
        !this._popup?.contains(el)
      ) {
        all.push(el);
      }
      node = walker.nextNode();
    }
    const trigger = this._elementRef.nativeElement;
    const triggerFocusables = all.filter(
      (el) => trigger.contains(el) || el === trigger
    );
    const last = triggerFocusables[triggerFocusables.length - 1] ?? trigger;
    const idx = all.indexOf(last);
    return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  }

  private _onPopupFocusOut = (event: FocusEvent) => {
    const newFocus = event.relatedTarget as Node | null;
    if (
      !this._popup?.contains(newFocus) &&
      !this._elementRef.nativeElement.contains(newFocus)
    ) {
      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.tooltipCloseDelay() as number
      );
    }
  };

  private _resolveAriaTarget(): HTMLElement | undefined {
    return (this._document.activeElement as HTMLElement | null) ?? undefined;
  }

  // aria-describedby is not read by SR on click trigger.
  // Use a self-removing live region. It must exist in DOM
  // before content is set, hence the 100ms delay.
  private _announce(text: string): void {
    const el = this._document.createElement('div');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.className = 'cps-sr-only';
    this._document.body.appendChild(el);
    setTimeout(() => {
      el.textContent = text;
      setTimeout(() => el.remove(), 1000);
    }, 100);
  }
}
