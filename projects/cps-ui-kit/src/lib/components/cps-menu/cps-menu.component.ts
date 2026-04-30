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
  OnInit,
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
  KEYDOWN_TAB = 'keydown-tab',
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
export class CpsMenuComponent
  implements AfterViewInit, OnDestroy, OnChanges, OnInit
{
  /**
   * Header title of the menu.
   * @group Props
   */
  @Input() header = '';

  /**
   * Aria label for the menu component, used for accessibility, it takes precedence over header.
   * @group Props
   */
  @Input() ariaLabel = '';

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
   * Determines whether the menu should move focus to its first item (or first focusable element) when opened.
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

  /**
   * Callback to invoke when the mouse leaves the menu container.
   * @group Emits
   */
  @Output() containerMouseLeave = new EventEmitter<MouseEvent>();

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

  private _rootFontSizePx = 16;
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

  ngOnInit(): void {
    this._rootFontSizePx = parseFloat(
      getComputedStyle(this.document.documentElement).fontSize || '16'
    );
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
    this.isOverlayAnimationInProgress = true;
    this.cd.markForCheck();
  }

  isVisible() {
    return this.overlayVisible;
  }

  onItemClick(event: any, item: CpsMenuItem) {
    if (item.disabled || item.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (item.action) {
      item.action({
        originalEvent: event,
        item
      });
    }
    this.hide(CpsMenuHideReason.CLICK_ITEM);
    (this.target as HTMLElement)?.focus();
  }

  onItemKeydown(event: KeyboardEvent, item: CpsMenuItem) {
    if (item.disabled || item.loading) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (!item.url) {
        event.preventDefault();
        this.onItemClick(event, item);
      } else if (event.key === ' ') {
        event.preventDefault();
        (event.currentTarget as HTMLElement).click();
      }
    }
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
              if (!this.overlayVisible) return;
              switch (event.key) {
                case 'Escape':
                  this.zone.run(() => {
                    this.hide(CpsMenuHideReason.KEYDOWN_ESCAPE);
                  });
                  (this.target as HTMLElement)?.focus();
                  break;
                case 'Tab':
                  if (this.items.length > 0) {
                    event.preventDefault();
                    this.zone.run(() => {
                      this.hide(CpsMenuHideReason.KEYDOWN_TAB);
                    });
                    this._focusNextTabbable(event.shiftKey);
                  } else if (this.container) {
                    const focusable = this._focusableIn(this.container);
                    const active = this.document.activeElement;
                    if (
                      !event.shiftKey &&
                      active === focusable[focusable.length - 1]
                    ) {
                      event.preventDefault();
                      this.zone.run(() => {
                        this.hide(CpsMenuHideReason.KEYDOWN_TAB);
                      });
                      (
                        this._getNextFocusableAfterTarget() ??
                        (this.target as HTMLElement)
                      )?.focus();
                    } else if (event.shiftKey && active === focusable[0]) {
                      event.preventDefault();
                      this.zone.run(() => {
                        this.hide(CpsMenuHideReason.KEYDOWN_TAB);
                      });
                      (this.target as HTMLElement)?.focus();
                    }
                  }
                  break;
                case 'ArrowDown':
                  if (this.items.length > 0) {
                    event.preventDefault();
                    this._navigateItems(1);
                  }
                  break;
                case 'ArrowUp':
                  if (this.items.length > 0) {
                    event.preventDefault();
                    this._navigateItems(-1);
                  }
                  break;
                case 'Home':
                  if (this.items.length > 0) {
                    event.preventDefault();
                    this._focusFirstItem();
                  }
                  break;
                case 'End':
                  if (this.items.length > 0) {
                    event.preventDefault();
                    this._focusLastItem();
                  }
                  break;
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

  private _pxToRem(px: number): number {
    return px / this._rootFontSizePx;
  }

  private _setPosition(element: any, target: any) {
    if (!element || !target) return;

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
          element.style.marginTop = '';
          return undefined;
      }
    };

    const pos = getPos();
    if (pos) {
      element.style.top = `${this._pxToRem(pos.top || 0)}rem`;
      element.style.left = `${this._pxToRem(pos.left || 0)}rem`;
    }
  }

  align() {
    if (!this.target) return;
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
      const containerWidthPx = this.container?.offsetWidth || 0;
      const targetWidthPx = this.target?.offsetWidth || 0;
      const arrowMinOffsetPx = 0.75 * this._rootFontSizePx;

      let arrowLeftPx =
        targetOffset.left + targetWidthPx / 2 - containerOffset.left;
      arrowLeftPx = Math.min(
        Math.max(arrowLeftPx, arrowMinOffsetPx),
        containerWidthPx - arrowMinOffsetPx
      );
      this.container?.style.setProperty(
        '--overlayArrowLeft',
        `${this._pxToRem(arrowLeftPx)}rem`
      );
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
      case 'open':
        this.bindScrollListener();
        break;

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
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        const menuItems = this._getMenuItems();
        if (menuItems.length) {
          menuItems[0].focus({ preventScroll: true });
        } else if (this.container) {
          this._focusableIn(this.container)[0]?.focus({ preventScroll: true });
        }
      }, 5);
    });
  }

  private _getMenuItems(): HTMLElement[] {
    if (!this.container) return [];
    return Array.from(
      this.container.getElementsByClassName('cps-menu-item')
    ) as HTMLElement[];
  }

  private _navigateItems(direction: 1 | -1) {
    const items = this._getMenuItems();
    if (!items.length) return;
    const currentIndex = items.indexOf(
      this.document.activeElement as HTMLElement
    );
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    items[nextIndex]?.focus();
  }

  private _focusFirstItem() {
    this._getMenuItems()[0]?.focus();
  }

  private _focusLastItem() {
    const items = this._getMenuItems();
    items[items.length - 1]?.focus();
  }

  private _focusNextTabbable(reverse = false): void {
    const all = this._focusableExcludingContainer();
    const idx = all.indexOf(this.target as HTMLElement);
    if (idx === -1) return;
    if (reverse) {
      const prevIdx = idx > 0 ? idx - 1 : all.length - 1;
      all[prevIdx]?.focus();
    } else {
      const nextIdx = idx < all.length - 1 ? idx + 1 : 0;
      all[nextIdx]?.focus();
    }
  }

  private _focusableExcludingContainer(): HTMLElement[] {
    return this._focusableIn(this.document.body).filter(
      (el) => !this.container?.contains(el)
    );
  }

  private _focusableIn(el: HTMLElement): HTMLElement[] {
    const result: HTMLElement[] = [];
    const walker = this.document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const child = node as HTMLElement;
      if (child.tabIndex >= 0 && !(child as HTMLInputElement).disabled) {
        result.push(child);
      }
      node = walker.nextNode();
    }
    return result;
  }

  private _getNextFocusableAfterTarget(): HTMLElement | null {
    const all = this._focusableExcludingContainer();
    const target = this.target as HTMLElement;
    const triggerFocusables = all.filter(
      (el) => target.contains(el) || el === target
    );
    const last = triggerFocusables[triggerFocusables.length - 1] ?? target;
    const idx = all.indexOf(last);
    return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
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
