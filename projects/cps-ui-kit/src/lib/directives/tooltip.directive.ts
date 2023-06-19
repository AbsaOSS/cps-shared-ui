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
  @Input() disabled = false;
  @Input() openOn: 'hover' | 'focus' | 'click' = 'hover';
  @Input() set closeOnContentClick(value: boolean) {
    if (!this.autoClose && value) {
      throw new Error(
        'closeOnContentClick cannot be true when autoClose is false'
      );
    }
    this.closeOnContentClick = value;
  }

  get closeOnContentClick() {
    return this.closeOnContentClick;
  }

  private _popup: HTMLDivElement = document.createElement('div');
  private _opened = false;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  private _createTooltip = () => {
    const tooltip = document.body.appendChild(this._popup);

    this._constructElement();

    if (
      this._popup &&
      !this._checkIfEnoughSpace(
        {
          x: this._popup.getBoundingClientRect().left,
          y: this._popup.getBoundingClientRect().top
        },
        tooltip
      )
    ) {
      this.position = 'top';

      this._destroyTooltip();
      this._createTooltip();
    }
  };

  private _destroyTooltip = () => {
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
      coords.x + popup.getBoundingClientRect().width > window.innerWidth ||
      coords.x - popup.getBoundingClientRect().width < 0
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
            this._elementRef.nativeElement.offsetHeight
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
          y: this._elementRef.nativeElement.getBoundingClientRect().top - 6
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
    if (this.openOn === 'click' && !this._opened) {
      this._opened = true;
      setTimeout(this._createTooltip, this.openDelay as number);
    } else if (this.closeOnContentClick && this._opened) {
      this._opened = false;
      setTimeout(this._destroyTooltip, this.closeDelay as number);
    }
  }
}
