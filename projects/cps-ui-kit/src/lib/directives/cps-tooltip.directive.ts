/* eslint-disable @typescript-eslint/no-explicit-any */
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
  @Input() tooltip = 'Add your text to this tooltip';
  @Input() openDelay: string | number = 300;
  @Input() closeDelay: string | number = 300;
  @Input() autoClose = true;
  @Input() position: Position = 'top';
  @Input() tooltipDisabled = false;
  @Input() openOn: 'hover' | 'focus' | 'click' = 'hover';
  @Input() closeOnContentClick = false;

  private _popup?: HTMLDivElement;
  private _showTimeout?: any;
  private _hideTimeout?: any;
  private _initialPosition!: 'top' | 'bottom' | 'left' | 'right';
  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (this.closeOnContentClick && this.autoClose)
      throw new Error(
        'closeOnContentClick cannot be true when autoClose is true'
      );

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

    this._destroyTooltip();
  }

  private _createTooltip = () => {
    this._destroyTooltip();

    if (this.tooltipDisabled) return;

    this._popup = document.createElement('div');

    this._constructElement(this._popup);

    if (this.closeOnContentClick)
      this._popup.addEventListener('click', this._destroyTooltip);
  };

  private _destroyTooltip = () => {
    if (this.tooltipDisabled) return;

    this._popup?.remove();

    this._popup?.removeEventListener('click', this._destroyTooltip);

    this._popup = undefined;
  };

  private _constructElement(popup: HTMLDivElement) {
    popup.innerHTML = this.tooltip;
    popup.setAttribute('class', 'cps-tooltip');
    document.body.appendChild(popup);

    const { x, y } = this._handleMissingSpace(
      this._checkIfNotEnoughSpace(
        this._getTooltipPosition(this._popup as HTMLDivElement)
      )
    );

    popup.style.top = y.toString() + 'px';
    popup.style.left = x.toString() + 'px';
  }

  private _checkSpaceOnRight() {
    return !(
      (this._popup as HTMLDivElement).getBoundingClientRect().width +
        this._elementRef.nativeElement.getBoundingClientRect().right >
      window.innerWidth
    );
  }

  private _checkSpaceOnLeft = (x: number) => !(x < window.screenLeft);

  private _checkSpaceOnBottom() {
    return !(
      (this._popup as HTMLDivElement).getBoundingClientRect().height +
        this._elementRef.nativeElement.getBoundingClientRect().bottom >
      window.innerHeight
    );
  }

  private _checkSpaceOnTop = (y: number) => !(y < window.screenTop);

  private _checkSpaceInPosition(
    coords: {
      x: number;
      y: number;
    },
    position: Position
  ) {
    switch (position) {
      case 'right':
        return this._checkSpaceOnRight();
      case 'bottom':
        return this._checkSpaceOnBottom();
      case 'left':
        return this._checkSpaceOnLeft(coords.x);
      case 'top':
        return this._checkSpaceOnTop(coords.y);
    }
  }

  private _checkIfNotEnoughSpace(coords: {
    x: number;
    y: number;
  }): [string, Position] {
    let enoughSpace = 'ENOUGH_SPACE';
    let position: Position = 'left';

    const right = this._checkSpaceOnRight();

    const left = this._checkSpaceOnLeft(coords.x);

    const bottom = this._checkSpaceOnBottom();

    const top = this._checkSpaceOnTop(coords.y);

    if (this._checkSpaceInPosition(coords, this.position) === false) {
      if (this.position === 'right' && right === false) {
        enoughSpace = 'NO_RIGHT';
        position = 'bottom';
      } else if (this.position === 'left' && left === false) {
        enoughSpace = 'NO_LEFT';
        position = 'top';
      } else if (this.position === 'bottom' && bottom === false) {
        enoughSpace = 'NO_BOTTOM';
        position = 'left';
      } else if (this.position === 'top' && top === false) {
        enoughSpace = 'NO_TOP';
        position = 'right';
      }

      return [enoughSpace, position];
    }

    if (!right && !left && !bottom && !top) {
      enoughSpace = 'NO_SPACE';
    } else enoughSpace = 'ENOUGH_SPACE';

    return [enoughSpace, position];
  }

  private _handleMissingSpace([spaceLeft, position]: [string, Position]): {
    x: number;
    y: number;
  } {
    while (spaceLeft !== 'ENOUGH_SPACE' && spaceLeft !== 'NO_SPACE') {
      switch (spaceLeft) {
        case 'NO_TOP':
          this.position = position;
          break;
        case 'NO_RIGHT':
          this.position = position;
          break;
        case 'NO_BOTTOM':
          this.position = position;
          break;
        case 'NO_LEFT':
          this.position = position;
          break;
        case 'NO_SPACE':
          this._destroyTooltip();
          break;
        default:
          this.position = this._initialPosition;
          break;
      }

      [spaceLeft] = this._checkIfNotEnoughSpace(
        this._getTooltipPosition(this._popup as HTMLDivElement)
      );
    }

    return this._getTooltipPosition(this._popup as HTMLDivElement);
  }

  private _getTooltipPosition(popup: HTMLDivElement) {
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
            window.scrollX +
            this._elementRef.nativeElement.offsetWidth +
            6,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top +
            window.scrollY +
            (this._elementRef.nativeElement.offsetHeight -
              popup.getBoundingClientRect().height) /
              2
        };
      default:
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            window.scrollX +
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

      this.position = this._initialPosition;

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

      this.position = this._initialPosition;

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

  @HostListener('window:resize') onPageResize() {
    this._destroyTooltip();
    this.position = this._initialPosition;
  }
}
