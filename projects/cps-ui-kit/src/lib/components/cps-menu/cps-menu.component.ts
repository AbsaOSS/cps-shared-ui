import {
  animate,
  AnimationEvent,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
  ViewRef
} from '@angular/core';
import { OverlayService, SharedModule } from 'primeng/api';
import { ConnectedOverlayScrollHandler, DomHandler } from 'primeng/dom';
import { ZIndexUtils } from 'primeng/utils';
import { Subscription } from 'rxjs';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsProgressCircularComponent } from '../cps-progress-circular/cps-progress-circular.component';
import { PrimeNG } from 'primeng/config';

type Nullable<T = void> = T | null | undefined;
type VoidListener = () => void | null | undefined;

/**
 * CpsMenuItem is used to define the items of the CpsMenuComponent.
 * @group Types
 */
export type CpsMenuItem = {
  title?: string;
  action?: (event?: any) => void;
  icon?: string;
  desc?: string;
  url?: string;
  target?: string;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * An enumeration of the different reasons for hiding the menu.
 * @group Enums
 */
export enum CpsMenuHideReason {
  FORCED = 'forced',
  TOGGLE = 'toggle',
  CLICK_ITEM = 'click-item',
  CLICK_OUTSIDE = 'click-outside',
  KEYDOWN_ESCAPE = 'keydown-escape',
  SCROLL = 'scroll',
  RESIZE = 'resize',
  TARGET_NOT_CONNECTED = 'target-not-connected'
}

/**
 * CpsMenuAttachPosition is used to define attachment position of the CpsMenuComponent.
 * @group Types
 */
export type CpsMenuAttachPosition = 'tr' | 'br' | 'tl' | 'bl' | 'default';

/**
 * CpsMenuComponent is a popup element, that contains menu items or arbitrary content.
 * @group Components
 */
@Component({
  imports: [
    CommonModule,
    SharedModule,
    CpsIconComponent,
    CpsProgressCircularComponent,
    RouterModule
  ],
  selector: 'cps-menu',
  templateUrl: './cps-menu.component.html',
  styleUrls: ['./cps-menu.component.scss'],
  animations: [
    trigger('animation', [
      state(
        'void',
        style({
          transform: 'scaleY(0.8)',
          opacity: 0
        })
      ),
      state(
        'close',
        style({
          transform: 'scaleY(0.8)',
          opacity: 0
        })
      ),
      state(
        'open',
        style({
          transform: 'translateY(0)',
          opacity: 1
        })
      ),
      transition('void => open', animate('{{showTransitionParams}}')),
      transition('open => close', animate('{{hideTransitionParams}}'))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CpsMenuComponent implements AfterViewInit, OnDestroy, OnChanges {
  /**
   * Header title of the menu.
   * @group Props
   */
  @Input() header = '';

  /**
   * An array of menu items.
   * @group Props
   */
  @Input() items: CpsMenuItem[] = [];

  /**
   * Determines whether to include top pointing arrow on the menu.
   * @group Props
   */
  @Input() withArrow = true;

  /**
   * Menu with prepared-colored items, without header and items description.
   * @group Props
   */
  @Input() compressed = false;

  /**
   * Determines whether the menu should show on target element focus.
   * @group Props
   */
  @Input() focusOnShow = true;

  /**
   * Determines whether the menu should be persistent.
   * @group Props
   */
  @Input() persistent = false;

  /**
   * Styling class of the menu container.
   * @group Props
   */
  @Input() containerClass = '';

  /**
   * Transition options of the show animation.
   * @group Props
   */
  @Input() showTransitionOptions = '.12s cubic-bezier(0, 0, 0.2, 1)';

  /**
   * Transition options of the hide animation.
   * @group Props
   */
  @Input() hideTransitionOptions = '.12s cubic-bezier(0, 0, 0.2, 1)';

  /**
   * Callback to invoke when menu is shown.
   * @group Emits
   */
  @Output() menuShown = new EventEmitter();

  /**
   * Callback to invoke when menu is hidden.
   * @param {CpsMenuHideReason} CpsMenuHideReason - reason for hiding the menu.
   * @group Emits
   */
  @Output() menuHidden = new EventEmitter<CpsMenuHideReason>();

  /**
   * Callback to invoke before menu is hidden.
   * @param {CpsMenuHideReason} CpsMenuHideReason - reason for hiding the menu.
   * @group Emits
   */
  @Output() beforeMenuHidden = new EventEmitter<CpsMenuHideReason>();

  /**
   * Callback to invoke when content is clicked.
   * @group Emits
   */
  @Output() contentClicked = new EventEmitter();

  withIcons = true;
  autoZIndex = true;
  baseZIndex = 0;
  dismissable = true;
  container: Nullable<HTMLDivElement>;
  overlayVisible = false;
  render = false;
  isOverlayAnimationInProgress = false;
  selfClick = false;
  target: any;
  scrollHandler: Nullable<ConnectedOverlayScrollHandler>;
  position: CpsMenuAttachPosition = 'default';

  documentResizeListener!: VoidListener | null;
  overlayEventListener: Nullable<(event?: any) => void>;
  documentClickListener!: VoidListener | null;
  documentKeydownListener!: VoidListener | null;

  // eslint-disable-next-line @typescript-eslint/ban-types
  destroyCallback: Nullable<Function>;
  overlaySubscription: Subscription | undefined;

  resizeObserver: ResizeObserver;

  itemsClasses: string[] = [];

  hideReason: CpsMenuHideReason | undefined;

  private window: Window;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: any,
    public el: ElementRef,
    public renderer: Renderer2,
    public cd: ChangeDetectorRef,
    private zone: NgZone,
    public primeNG: PrimeNG,
    public overlayService: OverlayService
  ) {
    this.window = this.document.defaultView as Window;
    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.target) {
        entries.forEach((entry) => {
          if (entry) this.align();
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.items || changes.compressed) {
      if (this.compressed) this.withIcons = this.items.some((itm) => itm.icon);
      this._setItemsClasses();
    }
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
  }

  private _setItemsClasses() {
    if (this.items.length < 1) return;

    this.itemsClasses = this.items.map((item, index) => {
      const res = ['cps-menu-item'];
      if (item.disabled || item.loading) res.push('cps-menu-item-disabled');
      if (index === 0) res.push('cps-menu-item-first');
      if (this.compressed) res.push('cps-menu-item-compressed');
      if (this.compressed && this.withIcons)
        res.push('cps-menu-item-compressed-with-icons');

      return res.join(' ');
    });
  }

  toggle(event?: any, target?: any, pos?: CpsMenuAttachPosition) {
    if (this.isOverlayAnimationInProgress) {
      return;
    }

    if (this.overlayVisible) {
      if (this.hasTargetChanged(event, target)) {
        this.destroyCallback = () => {
          this.show(null, target || event?.currentTarget || event?.target, pos);
        };
      }

      this.hide(CpsMenuHideReason.TOGGLE);
    } else {
      this.show(event, target, pos);
    }
  }

  show(event?: any, target?: any, pos?: CpsMenuAttachPosition) {
    target && event && event.stopPropagation();
    if (this.isOverlayAnimationInProgress) {
      return;
    }

    this.target = target || event?.currentTarget || event?.target;
    if (this.target) this.resizeObserver.observe(this.target);
    this.overlayVisible = true;
    this.render = true;
    this.position = pos || 'default';
    this.cd.markForCheck();
  }

  hide(reason?: CpsMenuHideReason) {
    if (!this.overlayVisible) return;
    this.hideReason = reason ?? CpsMenuHideReason.FORCED;
    this.overlayVisible = false;
    this.cd.markForCheck();
  }

  isVisible() {
    return this.overlayVisible;
  }

  onItemClick(event: any, item: CpsMenuItem) {
    if (item.disabled) return;
    if (item.action) {
      item.action({
        originalEvent: event,
        item
      });
    }
    this.hide(CpsMenuHideReason.CLICK_ITEM);
  }

  bindDocumentKeydownListener() {
    if (DomHandler.isTouchDevice()) return;
    if (isPlatformBrowser(this.platformId)) {
      if (!this.documentKeydownListener && this.dismissable) {
        this.zone.runOutsideAngular(() => {
          const documentTarget: any = this.el
            ? this.el.nativeElement.ownerDocument
            : this.document;

          this.documentKeydownListener = this.renderer.listen(
            documentTarget,
            'keydown',
            (event) => {
              // escape
              if (event.keyCode === 27) {
                this.zone.run(() => {
                  if (this.overlayVisible)
                    this.hide(CpsMenuHideReason.KEYDOWN_ESCAPE);
                });
              }
            }
          );
        });
      }
    }
  }

  unbindDocumentKeydownListener() {
    if (this.documentKeydownListener) {
      this.documentKeydownListener();
      this.documentKeydownListener = null;
    }
  }

  bindDocumentClickListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.documentClickListener && this.dismissable) {
        this.zone.runOutsideAngular(() => {
          const documentTarget: any = this.el
            ? this.el.nativeElement.ownerDocument
            : this.document;

          this.documentClickListener = this.renderer.listen(
            documentTarget,
            'mousedown',
            (event) => {
              if (
                !this.persistent &&
                !this.container?.contains(event.target) &&
                this.target !== event.target &&
                !this.target.contains(event.target) &&
                !this.selfClick
              ) {
                this.zone.run(() => {
                  this.hide(CpsMenuHideReason.CLICK_OUTSIDE);
                });
              }

              this.selfClick = false;
              this.cd.markForCheck();
            }
          );
        });
      }
    }
  }

  unbindDocumentClickListener() {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
      this.selfClick = false;
    }
  }

  onOverlayClick(event: MouseEvent) {
    this.overlayService.add({
      originalEvent: event,
      target: this.el.nativeElement
    });

    this.selfClick = true;
  }

  onContentClick() {
    this.selfClick = true;
    setTimeout(() => {
      this.contentClicked.emit();
    }, 100);
  }

  hasTargetChanged(event?: any, target?: any) {
    return (
      this.target &&
      this.target !== (target || event?.currentTarget || event?.target)
    );
  }

  appendContainer() {
    this.renderer.appendChild(this.document.body, this.container);
  }

  restoreAppend() {
    if (this.container) {
      this.renderer.appendChild(this.el.nativeElement, this.container);
    }
  }

  private _setPosition(element: any, target: any) {
    const getPos = () => {
      const targetOffset = DomHandler.getOffset(target);
      switch (this.position) {
        case 'bl':
          return {
            top: Math.max(
              targetOffset.top + target.offsetHeight - element.offsetHeight,
              0
            ),
            left: Math.max(0, targetOffset.left - element.offsetWidth)
          };
        case 'br':
          return {
            top: Math.max(
              targetOffset.top + target.offsetHeight - element.offsetHeight,
              0
            ),
            left: Math.min(
              targetOffset.left + target.offsetWidth,
              this.window.innerWidth - element.offsetWidth
            )
          };
        case 'tl':
          return {
            top: Math.min(
              targetOffset.top,
              this.window.innerHeight - element.offsetHeight
            ),
            left: Math.max(0, targetOffset.left - element.offsetWidth)
          };
        case 'tr':
          return {
            top: Math.min(
              targetOffset.top,
              this.window.innerHeight - element.offsetHeight
            ),
            left: Math.min(
              targetOffset.left + target.offsetWidth,
              this.window.innerWidth - element.offsetWidth
            )
          };
        case 'default':
        default:
          DomHandler.absolutePosition(element, target);
          return undefined;
      }
    };

    if (!element || !target) return;
    const pos = getPos();
    if (pos) {
      element.style.top = (pos.top || 0) + 'px';
      element.style.left = (pos.left || 0) + 'px';
    }
  }

  align() {
    if (!this.target.isConnected) {
      this.hide(CpsMenuHideReason.TARGET_NOT_CONNECTED);
      this._destroy();
      return;
    }

    if (this.autoZIndex) {
      ZIndexUtils.set(
        'overlay',
        this.container,
        this.baseZIndex + this.primeNG.zIndex.overlay
      );
    }

    this._setPosition(this.container, this.target);

    const containerOffset = DomHandler.getOffset(this.container);
    const targetOffset = DomHandler.getOffset(this.target);

    if (this.withArrow) {
      const borderRadius =
        this.document.defaultView
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ?.getComputedStyle(this.container!)
          ?.getPropertyValue('border-radius') || '0';

      let arrowLeft = 0;

      const containerWidth = this.container?.offsetWidth || 0;

      if (containerOffset.left < targetOffset.left) {
        arrowLeft =
          20 +
          targetOffset.left -
          containerOffset.left -
          parseFloat(borderRadius) * 2;
      } else {
        const targetWidth = this.target?.offsetWidth || 0;
        arrowLeft = Math.min(targetWidth / 2, containerWidth / 2);
      }
      arrowLeft = Math.min(Math.max(arrowLeft, 12), containerWidth - 12);
      this.container?.style.setProperty('--overlayArrowLeft', `${arrowLeft}px`);
    }

    if (containerOffset.top < targetOffset.top) {
      DomHandler.addClass(this.container, 'cps-menu-container-flipped');
    }
  }

  onAnimationStart(event: AnimationEvent) {
    if (event.toState === 'close') {
      this.beforeMenuHidden.emit(this.hideReason);
    } else if (event.toState === 'open') {
      this.container = event.element;
      if (this.container) this.resizeObserver.observe(this.container);
      this.appendContainer();
      this.align();
      this.bindDocumentClickListener();
      this.bindDocumentKeydownListener();
      this.bindDocumentResizeListener();
      this.bindScrollListener();

      if (this.focusOnShow) {
        this.focus();
      }

      this.overlayEventListener = (e) => {
        if (this.container && this.container.contains(e.target)) {
          this.selfClick = true;
        }
      };

      this.overlaySubscription = this.overlayService.clickObservable.subscribe(
        this.overlayEventListener
      );
      this.menuShown.emit(null);
    }

    this.isOverlayAnimationInProgress = true;
  }

  onAnimationEnd(event: AnimationEvent) {
    switch (event.toState) {
      case 'void':
        if (this.destroyCallback) {
          this.destroyCallback();
          this.destroyCallback = null;
        }

        if (this.overlaySubscription) {
          this.overlaySubscription.unsubscribe();
        }
        break;

      case 'close':
        if (this.autoZIndex) {
          ZIndexUtils.clear(this.container);
        }

        if (this.overlaySubscription) {
          this.overlaySubscription.unsubscribe();
        }

        this.onContainerDestroy();
        this.menuHidden.emit(this.hideReason);
        this.render = false;
        break;
    }

    this.isOverlayAnimationInProgress = false;
  }

  focus() {
    const focusable = DomHandler.findSingle(this.container, '[autofocus]');
    if (focusable) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => focusable.focus(), 5);
      });
    }
  }

  onWindowResize() {
    if (this.overlayVisible && !DomHandler.isTouchDevice()) {
      this.hide(CpsMenuHideReason.RESIZE);
    }
  }

  bindDocumentResizeListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.documentResizeListener) {
        const window = this.document.defaultView as Window;
        this.documentResizeListener = this.renderer.listen(
          window,
          'resize',
          this.onWindowResize.bind(this)
        );
      }
    }
  }

  unbindDocumentResizeListener() {
    if (this.documentResizeListener) {
      this.documentResizeListener();
      this.documentResizeListener = null;
    }
  }

  bindScrollListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.scrollHandler) {
        this.scrollHandler = new ConnectedOverlayScrollHandler(
          this.target,
          () => {
            if (this.overlayVisible) {
              this.hide(CpsMenuHideReason.SCROLL);
            }
          }
        );
      }

      this.scrollHandler.bindScrollListener();
    }
  }

  unbindScrollListener() {
    if (this.scrollHandler) {
      this.scrollHandler.unbindScrollListener();
    }
  }

  onContainerDestroy() {
    if (!(this.cd as ViewRef).destroyed) {
      this.target = null;
    }

    this.unbindDocumentClickListener();
    this.unbindDocumentKeydownListener();
    this.unbindDocumentResizeListener();
    this.unbindScrollListener();
  }

  private _destroy() {
    if (this.scrollHandler) {
      this.scrollHandler.destroy();
      this.scrollHandler = null;
    }

    if (this.container && this.autoZIndex) {
      ZIndexUtils.clear(this.container);
    }

    if (!(this.cd as ViewRef).destroyed) {
      this.target = null;
    }

    this.destroyCallback = null;
    if (this.container) {
      this.restoreAppend();
      this.onContainerDestroy();
    }

    this.overlaySubscription?.unsubscribe();

    this.resizeObserver?.disconnect();
  }

  ngOnDestroy() {
    this._destroy();
  }
}
