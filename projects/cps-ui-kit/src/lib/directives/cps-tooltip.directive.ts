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
      this._switchPosition(
        this._getTooltipPosition(this._popup as HTMLDivElement)
      )
    );

    popup.style.top = y.toString() + 'px';
    popup.style.left = x.toString() + 'px';
  }

  private _checkSpaceOnRight(x: number) {
    return !(
      (this._popup as HTMLDivElement).getBoundingClientRect().width + x >
      window.innerWidth
    );
  }

  private _checkSpaceOnLeft = (x: number) => !(x < window.screenLeft);

  private _checkSpaceOnBottom(y: number) {
    return !(y > window.innerHeight);
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
        return this._checkSpaceOnRight(coords.x);
      case 'bottom':
        return this._checkSpaceOnBottom(coords.y);
      case 'left':
        return this._checkSpaceOnLeft(coords.x);
      case 'top':
        return this._checkSpaceOnTop(coords.y);
    }
  }

  private _checkIfNotEnoughSpace(popup: HTMLDivElement) {
    const elementRefDimensions =
      this._elementRef.nativeElement.getBoundingClientRect();
    const popupDimensions = popup.getBoundingClientRect();

    return (
      elementRefDimensions.left - popupDimensions.left - window.scrollX <=
        window.screenLeft &&
      elementRefDimensions.right + popupDimensions.width + window.scrollX >
        window.innerWidth &&
      elementRefDimensions.bottom + popupDimensions.height + window.scrollY >
        window.innerHeight &&
      elementRefDimensions.top - popupDimensions.top - window.scrollY <
        window.screenTop
    );
  }

  private _switchPosition(coords: {
    x: number;
    y: number;
  }): [string, Position] {
    const right = this._checkSpaceOnRight(coords.x);

    const left = this._checkSpaceOnLeft(coords.x);

    const bottom = this._checkSpaceOnBottom(coords.y);

    const top = this._checkSpaceOnTop(coords.y);

    if (this._checkIfNotEnoughSpace(this._popup as HTMLDivElement))
      return ['NO_SPACE', this.position];

    if (this._checkSpaceInPosition(coords, this.position) === false) {
      if (this.position === 'right' && right === false) {
        return ['NO_RIGHT', 'bottom'];
      } else if (this.position === 'left' && left === false) {
        return ['NO_LEFT', 'top'];
      } else if (this.position === 'bottom' && bottom === false) {
        return ['NO_BOTTOM', 'left'];
      } else if (this.position === 'top' && top === false) {
        return ['NO_TOP', 'right'];
      }
    }

    return ['ENOUGH_SPACE', this.position];
  }

  private _handleMissingSpace([spaceLeft, position]: [string, Position]): {
    x: number;
    y: number;
  } {
    while (spaceLeft !== 'ENOUGH_SPACE') {
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

          throw new Error('Not enough space on screen for tooltip!');
        default:
          this.position = this._initialPosition;
          break;
      }

      [spaceLeft, position] = this._switchPosition(
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
            this._elementRef.nativeElement.getBoundingClientRect().right +
            window.scrollX +
            popup.getBoundingClientRect().width / 2 +
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
