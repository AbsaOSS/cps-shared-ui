/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';

@Directive({
  selector: '[cpsTooltip]',
  standalone: true
})
export class CpsTooltipDirective implements OnInit, OnDestroy {
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
  private _popup?: HTMLDivElement;
  private _showTimeout?: any;
  private _hideTimeout?: any;
  private _initialPosition!: 'top' | 'bottom' | 'left' | 'right';
  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this._initialPosition = this.position;

    this._elementRef.nativeElement?.parentElement?.addEventListener(
      'scroll',
      this._destroyTooltip
    );
  }

  ngOnDestroy(): void {
    this._elementRef.nativeElement?.parentElement?.removeEventListener(
      'scroll',
      this._destroyTooltip
    );

    this._popup?.removeEventListener('click', this._destroyTooltip);

    this._destroyTooltip();
  }

  private _createTooltip = () => {
    this._destroyTooltip();

    if (this.tooltipDisabled) return;

    this._popup = document.createElement('div');

    this._popup = document.body.appendChild(this._popup);

    this._constructElement(this._popup);

    if (this.closeOnContentClick)
      this._popup.addEventListener('click', this._destroyTooltip);

    const enoughSpc = this._checkIfEnoughSpace(
      {
        x: this._popup.getBoundingClientRect().left,
        y: this._popup.getBoundingClientRect().top
      },
      this._popup
    );

    if (enoughSpc === 'NO_SPACE') {
      this._destroyTooltip();

      throw new Error('Not enough space for tooltip!');
    } else if (enoughSpc !== 'ENOUGH_SPACE') {
      this._handleMissingSpace(enoughSpc);

      this._createTooltip();
    } else {
      this.position = this._initialPosition;
    }
  };

  private _destroyTooltip = () => {
    if (this.tooltipDisabled) return;

    this._popup?.remove();

    this._popup = undefined;
  };

  private _constructElement(popup: HTMLDivElement) {
    popup.innerHTML = this.tooltip;
    popup.setAttribute('class', 'cps-tooltip');

    const { x, y } = this._setTooltipPosition(popup);

    popup.style.top = y.toString() + 'px';
    popup.style.left = x.toString() + 'px';
  }

  private _checkIfEnoughSpace(
    coords: { x: number; y: number },
    popup: HTMLDivElement
  ) {
    let leftSpace: string;

    if (
      coords.x + popup.getBoundingClientRect().width >= window.innerWidth &&
      coords.x - popup.getBoundingClientRect().width <= 0 &&
      coords.y + popup.getBoundingClientRect().height >= window.innerHeight &&
      coords.y - popup.getBoundingClientRect().height <= 0
    ) {
      leftSpace = 'NO_SPACE';
    } else if (
      coords.x + popup.getBoundingClientRect().width >=
      window.innerWidth
    )
      leftSpace = 'NO_RIGHT';
    else if (coords.x - popup.getBoundingClientRect().width <= 0)
      leftSpace = 'NO_LEFT';
    else if (
      coords.y + popup.getBoundingClientRect().height >=
      window.innerHeight
    )
      leftSpace = 'NO_BOTTOM';
    else if (coords.y - popup.getBoundingClientRect().height <= 0)
      leftSpace = 'NO_TOP';

    leftSpace = 'ENOUGH_SPACE';

    return leftSpace;
  }

  private _handleMissingSpace(spaceLeft: string) {
    if (spaceLeft === 'NO_TOP') this.position = 'right';
    if (spaceLeft === 'NO_RIGHT') this.position = 'bottom';
    if (spaceLeft === 'NO_BOTTOM') this.position = 'left';
    if (spaceLeft === 'NO_LEFT') this.position = 'top';
  }

  private _setTooltipPosition(popup: HTMLDivElement) {
    switch (this.position) {
      case 'bottom':
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            window.scrollX +
            (this._elementRef.nativeElement.offsetWidth -
              popup.getBoundingClientRect().width) /
              2,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            window.scrollY +
            this._elementRef.nativeElement.offsetHeight +
            6
        };
      case 'left':
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left -
            window.scrollX -
            popup.getBoundingClientRect().width -
            6,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            window.scrollY +
            (this._elementRef.nativeElement.offsetHeight -
              popup.getBoundingClientRect().height) /
              2
        };
      case 'right':
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            this._elementRef.nativeElement.offsetWidth +
            6,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            window.scrollY -
            (this._elementRef.nativeElement.offsetHeight -
              popup.getBoundingClientRect().height) /
              2
        };
      default:
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            (this._elementRef.nativeElement.offsetWidth -
              popup.getBoundingClientRect().width) /
              2,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            window.scrollY -
            popup.getBoundingClientRect().height -
            6
        };
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.openOn === 'hover') {
      clearTimeout(this._hideTimeout);

      this._showTimeout = setTimeout(
        this._createTooltip,
        this.openDelay as number
      );
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.autoClose) {
      clearTimeout(this._showTimeout);

      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.closeDelay as number
      );
    }
  }

  @HostListener('focus') onFocus() {
    if (this.openOn === 'focus') {
      clearTimeout(this._hideTimeout);

      this._showTimeout = setTimeout(
        this._createTooltip,
        this.openDelay as number
      );
    }
  }

  @HostListener('blur') onBlur() {
    if (this.autoClose && this.openOn === 'focus') {
      clearTimeout(this._showTimeout);

      this._hideTimeout = setTimeout(
        this._destroyTooltip,
        this.closeDelay as number
      );
    }
  }

  @HostListener('click') onClick() {
    if (this.openOn === 'click') {
      clearTimeout(this._hideTimeout);

      this._showTimeout = setTimeout(
        this._createTooltip,
        this.openDelay as number
      );
    }
  }

  @HostListener('window:scroll') onPageScroll() {
    this._destroyTooltip();
  }
}
