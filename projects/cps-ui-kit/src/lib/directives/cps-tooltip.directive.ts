import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject, tap, timer, switchMap, merge, Subscription } from 'rxjs';
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
  private _popup: HTMLDivElement = document.createElement('div');
  private _create$ = new Subject<boolean>();
  private _destroy$ = new Subject<boolean>();
  private _cycle$?: Subscription;
  // eslint-disable-next-line no-useless-constructor
  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this._cycle$ = this._handleCreationCycle();
  }

  ngOnDestroy(): void {
    this._create$.unsubscribe();
    this._destroy$.unsubscribe();
    this._cycle$?.unsubscribe();
  }

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
            (this._elementRef.nativeElement.offsetWidth -
              this._popup.getBoundingClientRect().width) /
              2,
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
            (this._elementRef.nativeElement.offsetHeight -
              this._popup.getBoundingClientRect().height) /
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
            (this._elementRef.nativeElement.offsetHeight -
              this._popup.getBoundingClientRect().height) /
              2
        };
      default:
        return {
          x:
            this._elementRef.nativeElement.getBoundingClientRect().left +
            (this._elementRef.nativeElement.offsetWidth -
              this._popup.getBoundingClientRect().width) /
              2,
          y:
            this._elementRef.nativeElement.getBoundingClientRect().top -
            this._popup.getBoundingClientRect().height -
            6
        };
    }
  }

  private _handleTrigger() {
    return this._create$.pipe(
      switchMap(() => timer(this.openDelay as number)),
      tap(this._createTooltip)
    );
  }

  private _handleDestroy() {
    return this._destroy$.pipe(
      switchMap(() => timer(this.closeDelay as number)),
      tap(this._destroyTooltip)
    );
  }

  private _handleCreationCycle() {
    return merge(this._handleTrigger(), this._handleDestroy()).subscribe();
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.openOn === 'hover') {
      this._create$.next(true);
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.autoClose) {
      this._destroy$.next(true);
    }
  }

  @HostListener('focus') onFocus() {
    if (this.openOn === 'focus') {
      this._create$.next(true);
    }
  }

  @HostListener('blur') onBlur() {
    if (this.autoClose && this.openOn === 'focus') {
      this._destroy$.next(true);
    }
  }

  @HostListener('click') onClick() {
    if (this.openOn === 'click') {
      this._create$.next(true);
    }
  }
}
