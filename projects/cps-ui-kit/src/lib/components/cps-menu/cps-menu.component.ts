import {
  animate,
  AnimationEvent,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
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
  disabled?: boolean;
};

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, CpsIconComponent],
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
export class CpsMenuComponent implements AfterViewInit, OnDestroy {
  @Input() header = '';
  @Input() items: CpsMenuItem[] = [];
  @Input() withArrow = true;
  @Input() compressed = false; // prepared-colored, without header and items description
  @Input() focusOnShow = true;
  @Input() containerClass = '';
  @Input() showTransitionOptions = '.12s cubic-bezier(0, 0, 0.2, 1)';
  @Input() hideTransitionOptions = '.12s cubic-bezier(0, 0, 0.2, 1)';

  @Output() menuShown = new EventEmitter();
  @Output() menuHidden = new EventEmitter();
  @Output() beforeMenuHidden = new EventEmitter();

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

  documentResizeListener!: VoidListener | null;
  overlayEventListener: Nullable<(event?: any) => void>;
  documentClickListener!: VoidListener | null;
  documentKeydownListener!: VoidListener | null;

  // eslint-disable-next-line @typescript-eslint/ban-types
  destroyCallback: Nullable<Function>;
  overlaySubscription: Subscription | undefined;

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
  ) {}

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
  }

  toggle(event?: any, target?: any) {
    if (this.isOverlayAnimationInProgress) {
      return;
    }

    if (this.overlayVisible) {
      if (this.hasTargetChanged(event, target)) {
        this.destroyCallback = () => {
          this.show(null, target || event?.currentTarget || event?.target);
        };
      }

      this.hide();
    } else {
      this.show(event, target);
    }
  }

  show(event?: any, target?: any) {
    target && event && event.stopPropagation();
    if (this.isOverlayAnimationInProgress) {
      return;
    }

    this.target = target || event?.currentTarget || event?.target;
    this.overlayVisible = true;
    this.render = true;
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

  align() {
    if (this.autoZIndex) {
      ZIndexUtils.set(
        'overlay',
        this.container,
        this.baseZIndex + this.config.zIndex.overlay
      );
    }

    DomHandler.absolutePosition(this.container, this.target);

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
      if (this.compressed) this.withIcons = this.items.some((itm) => itm.icon);
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

    if (this.overlaySubscription) {
      this.overlaySubscription.unsubscribe();
    }
  }
}
