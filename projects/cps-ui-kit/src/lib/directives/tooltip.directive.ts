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
  @Input() closeOnContentClick = false;
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() disabled = false;
  @Input() openOn: 'hover' | 'focus' | 'click' = 'hover';

  private _popup?: HTMLDivElement;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  private _createTooltip = () => {
    const { x, y } = this._setTooltipPosition();
    this._popup = document.createElement('div');

    this._popup.innerHTML = this.tooltip;
    this._popup.setAttribute('class', 'cps-tooltip');
    this._popup.style.top = y.toString() + 'px';
    this._popup.style.left = x.toString() + 'px';

    document.body.appendChild(this._popup);
  };

  private _destroyTooltip = () => {
    this._popup?.remove();
  };

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
          x: this._elementRef.nativeElement.getBoundingClientRect().left - 6,
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
    if (this.openOn === 'click') {
      setTimeout(this._createTooltip, this.openDelay as number);
    }
  }
}
