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

    this._destroyTooltip();
  }

  private _createTooltip = () => {
    this._destroyTooltip();

    if (this.tooltipDisabled) return;

    this._popup = document.createElement('div');

    document.body.appendChild(this._popup);

    this._constructElement(this._popup);

    if (this.closeOnContentClick)
      this._popup.addEventListener('click', this._destroyTooltip);

    this._handleMissingSpace(this._checkIfEnoughSpace(this._popup));
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

    const { x, y } = this._getTooltipPosition(popup);

    popup.style.top = y.toString() + 'px';
    popup.style.left = x.toString() + 'px';
  }

  private _checkIfEnoughSpace(popup: HTMLDivElement): [string, Position] {
    let enoughSpace: string;
    let position: Position = 'left';

    if (
      popup.getBoundingClientRect().right > window.innerWidth &&
      popup.getBoundingClientRect().left < 0 &&
      popup.getBoundingClientRect().bottom > window.innerHeight &&
      popup.getBoundingClientRect().top < window.screenTop
    ) {
      enoughSpace = 'NO_SPACE';
    } else if (popup.getBoundingClientRect().right > window.innerWidth) {
      enoughSpace = 'NO_RIGHT';
      position = 'bottom';
    } else if (popup.getBoundingClientRect().left < 0) {
      enoughSpace = 'NO_LEFT';
      position = 'top';
    } else if (popup.getBoundingClientRect().bottom > window.innerHeight) {
      enoughSpace = 'NO_BOTTOM';
      position = 'left';
    } else if (popup.getBoundingClientRect().top < window.screenTop) {
      enoughSpace = 'NO_TOP';
      position = 'right';
    } else {
      enoughSpace = 'ENOUGH_SPACE';
    }

    return [enoughSpace, position];
  }

  private _handleMissingSpace([spaceLeft, position]: [
    string,
    Position
  ]): string {
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
        return '';
      default:
        this.position = this._initialPosition;
        break;
    }

    this._constructElement(this._popup as HTMLDivElement);

    return spaceLeft;
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
