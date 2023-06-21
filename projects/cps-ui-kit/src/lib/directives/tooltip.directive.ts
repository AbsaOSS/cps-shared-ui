import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[cpsTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input() tooltip = 'Add your text to this tooltip';
  @Input() openDelay: string | number = 300;
  @Input() closeDelay: string | number = 300;
  @Input() autoClose = true;
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDisabled = false;
  @Input() openOn: 'hover' | 'focus' | 'click' = 'hover';
  @Input() set closeOnContentClick(value: boolean) {
    if (this.autoClose && value) {
      throw new Error(
        'closeOnContentClick cannot be true when autoClose is true'
      );
    }
    this._closeOnContentClick = value;
  }

  get closeOnContentClick() {
    return this._closeOnContentClick;
  }

  private _closeOnContentClick = false;
  private _popup: HTMLDivElement = document.createElement('div');

  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  private _createTooltip = () => {
    if (this.tooltipDisabled) return;

    const tooltipEl = document.body.appendChild(this._popup);

    this._constructElement();

    if (this.closeOnContentClick)
      this._popup.addEventListener('click', this._destroyTooltip);

    if (
      !this._checkIfEnoughSpace(
        {
          x: this._popup.getBoundingClientRect().left,
          y: this._popup.getBoundingClientRect().top
        },
        tooltipEl
      )
    ) {
      this.position = 'top';

      this._destroyTooltip();
      this._createTooltip();
    }
  };

  private _destroyTooltip = () => {
    if (this.tooltipDisabled) return;

    this._popup?.remove();
  };

  private _constructElement() {
    this._popup.innerHTML = this.tooltip;
    this._popup.setAttribute('class', 'cps-tooltip');

    const { x, y } = this._setTooltipPosition();

    this._popup.style.top = y.toString() + 'px';
    this._popup.style.left = x.toString() + 'px';
  }

  private _checkIfEnoughSpace(
    coords: { x: number; y: number },
    popup: HTMLDivElement
  ) {
    if (
      coords.x + popup.getBoundingClientRect().width >= window.innerWidth ||
      coords.x - popup.getBoundingClientRect().width <= 0
    )
      return false;

    return true;
  }

  private _setTooltipPosition() {
    switch (this.position) {
      case 'bottom':
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            this._elementRef.nativeElement.offsetWidth / 2,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            this._elementRef.nativeElement.offsetHeight +
            6
        };
      case 'left':
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left -
            this._popup.getBoundingClientRect().width -
            6,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            this._elementRef.nativeElement.offsetHeight / 2
        };
      case 'right':
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            this._elementRef.nativeElement.offsetWidth +
            6,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            this._elementRef.nativeElement.offsetHeight / 2
        };
      default:
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            this._elementRef.nativeElement.offsetWidth / 2,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top -
            this._popup.getBoundingClientRect().height -
            6
        };
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.openOn === 'hover') {
      setTimeout(this._createTooltip, this.openDelay as number);
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.autoClose) {
      setTimeout(this._destroyTooltip, this.closeDelay as number);
    }
  }

  @HostListener('focus') onFocus() {
    if (this.openOn === 'focus') {
      setTimeout(this._createTooltip, this.openDelay as number);
    }
  }

  @HostListener('click') onClick() {
    if (this.openOn === 'click') {
      setTimeout(this._createTooltip, this.openDelay as number);
    }
  }
}
