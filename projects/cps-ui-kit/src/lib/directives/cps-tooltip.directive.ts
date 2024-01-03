import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy
} from '@angular/core';
import { convertSize } from '../utils/internal/size-utils';

export type CpsTooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type CpsTooltipOpenOn = 'hover' | 'click' | 'focus';

/**
 * CpsTooltipDirective provides advisory information for a target element.
 * @group Directives
 */
@Directive({
  selector: '[cpsTooltip]',
  standalone: true
})
export class CpsTooltipDirective implements OnDestroy {
  /**
   * Tooltip text or html to show.
   * @group Props
   */
  @Input('cpsTooltip') tooltip!: string;

  /**
   * Delay to show the tooltip in milliseconds, it can be of type string or number.
   * @group Props
   */
  @Input() tooltipOpenDelay: string | number = 300;

  /**
   * Delay to hide the tooltip in milliseconds, it can be of type string or number.
   * @group Props
   */
  @Input() tooltipCloseDelay: string | number = 300;

  /**
   * Determines whether the tooltip should open on hover, click or focus.
   * @group Props
   */
  @Input() tooltipOpenOn: CpsTooltipOpenOn = 'hover';

  /**
   * Position of the tooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() tooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Determines whether the tooltip is persistent.
   * @group Props
   */
  @Input() tooltipPersistent = false;

  /**
   * When present, it specifies that the tooltip should be disabled.
   * @group Props
   */
  @Input() tooltipDisabled = false;

  /**
   * Max width of the tooltip of type number denoting pixels or string.
   * @group Props
   */
  @Input() tooltipMaxWidth: number | string = '100%';

  /**
   * Tooltip content class for styling.
   * @group Props
   */
  @Input() tooltipContentClass = 'cps-tooltip-content';

  private _popup?: HTMLDivElement;
  private _showTimeout?: any;
  private _hideTimeout?: any;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    this._destroyTooltip();
  }

  private _createTooltip = () => {
    if (this._popup) return;

    if (this.tooltipDisabled) return;

    this._popup = document.createElement('div');
    this._constructElement(this._popup);

    if (this.tooltipPersistent)
      this._popup.addEventListener('click', this._destroyTooltip);

    window.addEventListener('scroll', this._destroyTooltip, true);
  };

  private _destroyTooltip = (event: any = undefined) => {
    const removeFromDOM = () => {
      this._popup?.remove();
      this._popup = undefined;
    };

    window.removeEventListener('scroll', this._destroyTooltip, true);
    if (!this._popup) return;

    this._popup.removeEventListener('click', this._destroyTooltip);

    const noAnimation = ['scroll', 'resize'].includes(event?.type);

    if (noAnimation) {
      removeFromDOM();
    } else {
      const popup = this._popup as HTMLDivElement;
      requestAnimationFrame(function () {
        popup.style.opacity = '0';
      });

      setTimeout(() => {
        removeFromDOM();
      }, 200);
    }
  };

  private _constructElement(popup: HTMLDivElement) {
    const popupContent = document.createElement('div');
    popupContent.innerHTML = this.tooltip || 'Add your text to this tooltip';
    popupContent.classList.add(this.tooltipContentClass);
    popup.appendChild(popupContent);

    popup.classList.add('cps-tooltip');
    popup.style.maxWidth = convertSize(this.tooltipMaxWidth);

    document.body.appendChild(popup);
    requestAnimationFrame(function () {
      popup.style.opacity = '1';
    });

    const coords = this._getCoords();
    if (!coords) {
      this._destroyTooltip();
      throw new Error('Not enough space on the screen for the tooltip!');
    }

    popup.style.left = coords.left.toString() + 'px';
    popup.style.top = coords.top.toString() + 'px';
  }

  private _getCoords(): { left: number; top: number } | undefined {
    function isInsideScreen(coords: { left: number; top: number }): boolean {
      return (
        coords.top >= 0 &&
        coords.left >= 0 &&
        coords.left + popupRect.width <= window.innerWidth &&
        coords.top + popupRect.height <= window.innerHeight
      );
    }

    let positions = ['top', 'bottom', 'left', 'right'] as CpsTooltipPosition[];
    positions = positions.filter((item) => item !== this.tooltipPosition);
    positions.unshift(this.tooltipPosition);

    const targetEl = this._elementRef.nativeElement;
    const targetElRect = targetEl.getBoundingClientRect();
    const popupRect = (this._popup as HTMLDivElement).getBoundingClientRect();

    for (const pos of positions) {
      const coords = this._getCoordsForPosition(
        pos as CpsTooltipPosition,
        targetEl,
        targetElRect,
        popupRect
      );

      if (isInsideScreen(coords)) {
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
            window.scrollX +
            (targetEl.offsetWidth - popupRect.width) / 2,
          top: targetElRect.bottom + window.scrollY + 8
        };
      case 'left':
        return {
          left: targetElRect.left - window.scrollX - popupRect.width - 8,
          top:
            targetElRect.top +
            window.scrollY +
            (targetEl.offsetHeight - popupRect.height) / 2
        };
      case 'right':
        return {
          left: targetElRect.right + window.scrollX + 8,
          top:
            targetElRect.top +
            window.scrollY +
            (targetEl.offsetHeight - popupRect.height) / 2
        };
      default:
        return {
          left:
            targetElRect.left +
            window.scrollX +
            (targetEl.offsetWidth - popupRect.width) / 2,
          top: targetElRect.top + window.scrollY - popupRect.height - 8
        };
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.tooltipOpenOn === 'hover') {
      clearTimeout(this._hideTimeout);

      this._showTimeout = setTimeout(
        this._createTooltip,
        this.tooltipOpenDelay as number
      );
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    clearTimeout(this._showTimeout);

    if (!this.tooltipPersistent) {
      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.tooltipCloseDelay as number
      );
    }
  }

  @HostListener('focus') onFocus() {
    if (this.tooltipOpenOn === 'focus') {
      clearTimeout(this._hideTimeout);

      this._showTimeout = setTimeout(
        this._createTooltip,
        this.tooltipOpenDelay as number
      );
    }
  }

  @HostListener('blur') onBlur() {
    clearTimeout(this._showTimeout);
    if (!this.tooltipPersistent && this.tooltipOpenOn === 'focus') {
      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.tooltipCloseDelay as number
      );
    }
  }

  @HostListener('click') onClick() {
    if (this.tooltipOpenOn === 'click') {
      clearTimeout(this._hideTimeout);

      this._showTimeout = setTimeout(this._createTooltip, 0);
    }
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: any) {
    if (this.tooltipPersistent && this._popup) {
      if (!target?.isConnected) {
        return;
      }
      const clickedInside = this._elementRef?.nativeElement?.contains(target);
      if (!clickedInside) {
        this._destroyTooltip();
      }
    }
  }

  @HostListener('window:resize', ['$event']) onPageResize(event: Event) {
    if (this._popup) this._destroyTooltip(event);
  }
}
