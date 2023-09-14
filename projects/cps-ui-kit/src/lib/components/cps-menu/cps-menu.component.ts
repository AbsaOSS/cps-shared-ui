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
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewEncapsulation,
  ViewRef
} from '@angular/core';
import { OverlayService, PrimeNGConfig, SharedModule } from 'primeng/api';
import { ConnectedOverlayScrollHandler, DomHandler } from 'primeng/dom';
import { ZIndexUtils } from 'primeng/utils';
import { Subscription } from 'rxjs';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';

type Nullable<T = void> = T | null | undefined;
type VoidListener = () => void | null | undefined;

export type CpsMenuItem = {
  title: string;
  action?: (event?: any) => void;
  icon?: string;
  desc?: string;
  url?: string;
  target?: string;
  disabled?: boolean;
};

export type CpsMenuAttachPosition = 'tr' | 'br' | 'tl' | 'bl' | 'default';

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, CpsIconComponent, RouterModule],
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
export class CpsMenuComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() header = '';
  @Input() items: CpsMenuItem[] = [];
  @Input() withArrow = true;
  @Input() compressed = false; // prepared-colored, without header and items description
  @Input() focusOnShow = true;
  @Input() persistent = false;
  @Input() containerClass = '';
  @Input() showTransitionOptions = '.12s cubic-bezier(0, 0, 0.2, 1)';
  @Input() hideTransitionOptions = '.12s cubic-bezier(0, 0, 0.2, 1)';

  @Output() menuShown = new EventEmitter();
  @Output() menuHidden = new EventEmitter();
  @Output() beforeMenuHidden = new EventEmitter();
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

  targetResizeObserver: ResizeObserver;

  itemsClasses: string[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: any,
    public el: ElementRef,
    public renderer: Renderer2,
    public cd: ChangeDetectorRef,
    private zone: NgZone,
    public config: PrimeNGConfig,
    public overlayService: OverlayService
  ) {
    this.targetResizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (this.target && entry) this.align();
      });
    });
  }

  ngOnInit(): void {
    if (this.compressed) this.withIcons = this.items.some((itm) => itm.icon);
    this._setItemsClasses();
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
  }

  private _setItemsClasses() {
    if (this.items.length < 1) return;

    this.itemsClasses = this.items.map((item, index) => {
      const res = ['cps-menu-item'];
      if (item.disabled) res.push('cps-menu-item-disabled');
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

      this.hide();
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
    if (this.target) this.targetResizeObserver.observe(this.target);
    this.overlayVisible = true;
    this.render = true;
    this.position = pos || 'default';
    this.cd.markForCheck();
  }

  hide() {
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
    this.hide();
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
                  if (this.overlayVisible) this.hide();
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
          const documentEvent = DomHandler.isIOS() ? 'touchstart' : 'click';
          const documentTarget: any = this.el
            ? this.el.nativeElement.ownerDocument
            : this.document;

          this.documentClickListener = this.renderer.listen(
            documentTarget,
            documentEvent,
            (event) => {
              if (
                !this.persistent &&
                !this.container?.contains(event.target) &&
                this.target !== event.target &&
                !this.target.contains(event.target) &&
                !this.selfClick
              ) {
                this.zone.run(() => {
                  this.hide();
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
            left: Math.max(0, targetOffset.left - element.offsetWidth - 1)
          };
        case 'br':
          return {
            top: Math.max(
              targetOffset.top + target.offsetHeight - element.offsetHeight,
              0
            ),
            left: Math.min(
              targetOffset.left + target.offsetWidth + 1,
              window.innerWidth - element.offsetWidth
            )
          };
        case 'tl':
          return {
            top: Math.min(
              targetOffset.top,
              window.innerHeight - element.offsetHeight
            ),
            left: Math.max(0, targetOffset.left - element.offsetWidth - 1)
          };
        case 'tr':
          return {
            top: Math.min(
              targetOffset.top,
              window.innerHeight - element.offsetHeight
            ),
            left: Math.min(
              targetOffset.left + target.offsetWidth + 1,
              window.innerWidth - element.offsetWidth
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
    if (this.autoZIndex) {
      ZIndexUtils.set(
        'overlay',
        this.container,
        this.baseZIndex + this.config.zIndex.overlay
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

      if (containerOffset.left < targetOffset.left) {
        arrowLeft =
          20 +
          targetOffset.left -
          containerOffset.left -
          parseFloat(borderRadius) * 2;
      } else {
        const containerWidth = this.container?.offsetWidth || 0;
        const targetWidth = this.target?.offsetWidth || 0;
        arrowLeft = Math.min(targetWidth / 2, containerWidth / 2);
      }
      arrowLeft = Math.max(arrowLeft, 12);
      this.container?.style.setProperty('--overlayArrowLeft', `${arrowLeft}px`);
    }

    if (containerOffset.top < targetOffset.top) {
      DomHandler.addClass(this.container, 'cps-menu-container-flipped');
    }
  }

  onAnimationStart(event: AnimationEvent) {
    if (event.toState === 'close') {
      this.beforeMenuHidden.emit(null);
    } else if (event.toState === 'open') {
      this.container = event.element;
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
        this.menuHidden.emit({});
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
      this.hide();
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
              this.hide();
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

  ngOnDestroy() {
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

    this.targetResizeObserver?.disconnect();
  }
}
