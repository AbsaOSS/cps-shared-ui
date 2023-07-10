import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';

type Position = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[cpsTooltip]',
  standalone: true
})
export class CpsTooltipDirective implements OnInit, OnDestroy {
  @Input('cpsTooltip') tooltip!: string;

  @Input() tooltipOpenDelay: string | number = 300;
  @Input() tooltipCloseDelay: string | number = 300;
  @Input() tooltipOpenOn: 'hover' | 'focus' | 'click' = 'hover';
  @Input() tooltipPosition: Position = 'top';
  @Input() tooltipPersistent = false;
  @Input() tooltipDisabled = false;

  private _popup?: HTMLDivElement;
  private _showTimeout?: any;
  private _hideTimeout?: any;

  // TODO PERSISTENT STATE (Outside click listener?)
  // TODO CHECK DISABLED TOOLTIP
  // TODO CHECK IF WE NEED TO DESTROY TOOLTIP ON CREATION

  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // TODO NOT EFFICIENT!!!
    window.addEventListener('scroll', this._destroyTooltip, true);

    // this._elementRef.nativeElement?.parentElement?.addEventListener(
    //   'scroll',
    //   this._destroyTooltip
    // );
  }

  ngOnDestroy(): void {
    // TODO NOT EFFICIENT!!!
    window.removeEventListener('scroll', this._destroyTooltip, true);
    // this._elementRef.nativeElement?.parentElement?.removeEventListener(
    //   'scroll',
    //   this._destroyTooltip
    // );

    this._destroyTooltip();
  }

  private _createTooltip = () => {
    this._destroyTooltip();

    if (this.tooltipDisabled) return;

    this._popup = document.createElement('div');

    this._constructElement(this._popup);

    if (this.tooltipPersistent)
      this._popup.addEventListener('click', this._destroyTooltip);
  };

  private _destroyTooltip = () => {
    if (this.tooltipDisabled) return;

    this._popup?.remove();

    this._popup?.removeEventListener('click', this._destroyTooltip);

    this._popup = undefined;
  };

  private _constructElement(popup: HTMLDivElement) {
    popup.innerHTML = this.tooltip || 'Add your text to this tooltip';
    popup.setAttribute('class', 'cps-tooltip');
    document.body.appendChild(popup);

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

    let positions = ['top', 'bottom', 'left', 'right'] as Position[];
    positions = positions.filter((item) => item !== this.tooltipPosition);
    positions.unshift(this.tooltipPosition);

    const targetElRect = this._elementRef.nativeElement.getBoundingClientRect();
    const popupRect = (this._popup as HTMLDivElement).getBoundingClientRect();

    for (const pos of positions) {
      const coords = this._getCoordsForPosition(
        pos as Position,
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
    position: Position,
    targetElRect: DOMRect,
    popupRect: DOMRect
  ): {
    left: number;
    top: number;
  } {
    const targetEl = this._elementRef.nativeElement;
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
    if (!this.tooltipPersistent) {
      clearTimeout(this._showTimeout);

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
    if (!this.tooltipPersistent && this.tooltipOpenOn === 'focus') {
      clearTimeout(this._showTimeout);

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

  @HostListener('window:resize') onPageResize() {
    this._destroyTooltip();
  }
}
