import {
  animate,
  animation,
  AnimationEvent,
  style,
  transition,
  trigger,
  useAnimation
} from '@angular/animations';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  Type,
  ViewChild,
  ViewEncapsulation,
  ViewRef
} from '@angular/core';
import { PrimeNGConfig, SharedModule } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
import { ZIndexUtils } from 'primeng/utils';
import { CpsDialogContentDirective } from '../../directives/cps-dialog-content.directive';
import { CpsDialogConfig } from '../../../utils/cps-dialog-config';
import { CpsDialogRef } from '../../../utils/cps-dialog-ref';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsInfoCircleComponent } from '../../../../../components/cps-info-circle/cps-info-circle.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';

const showAnimation = animation([
  style({ transform: '{{transform}}', opacity: 0 }),
  animate('{{transition}}', style({ transform: 'none', opacity: 1 }))
]);

const hideAnimation = animation([
  animate('{{transition}}', style({ transform: '{{transform}}', opacity: 0 }))
]);

type Nullable<T = void> = T | null | undefined;
type VoidListener = () => void | null | undefined;

@Component({
  selector: 'cps-dialog',
  imports: [
    CommonModule,
    SharedModule,
    CpsDialogContentDirective,
    CpsButtonComponent,
    CpsInfoCircleComponent,
    CpsIconComponent
  ],
  templateUrl: './cps-dialog.component.html',
  styleUrls: ['./cps-dialog.component.scss'],
  animations: [
    trigger('animation', [
      transition('void => visible', [useAnimation(showAnimation)]),
      transition('visible => void', [useAnimation(hideAnimation)])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None
})
export class CpsDialogComponent implements AfterViewInit, OnDestroy {
  visible = true;

  componentRef: Nullable<ComponentRef<any>>;

  resizing: boolean | undefined;

  dragging: boolean | undefined;

  maximized: boolean | undefined;

  _style: any = {};

  originalStyle: any;

  lastPageX: number | undefined;

  lastPageY: number | undefined;

  @ViewChild(CpsDialogContentDirective)
  insertionPoint: Nullable<CpsDialogContentDirective>;

  @ViewChild('mask') maskViewChild: Nullable<ElementRef>;
  @ViewChild('content') contentViewChild: Nullable<ElementRef>;
  @ViewChild('header') headerViewChild: Nullable<ElementRef>;

  childComponentType: Nullable<Type<any>>;

  container: Nullable<HTMLDivElement>;

  wrapper: Nullable<HTMLElement>;

  documentEscapeListener!: VoidListener | null;

  maskClickListener!: VoidListener | null;

  transformOptions = 'scale(0.7)';

  documentResizeListener!: VoidListener | null;

  documentResizeEndListener!: VoidListener | null;

  documentDragListener!: VoidListener | null;

  documentDragEndListener!: VoidListener | null;

  _openStateChanged = new EventEmitter<void>();
  _dragStarted = new EventEmitter<MouseEvent>();
  _dragEnded = new EventEmitter<MouseEvent>();
  _resizeStarted = new EventEmitter<MouseEvent>();
  _resizeEnded = new EventEmitter<MouseEvent>();
  _maximizedStateChanged = new EventEmitter<boolean>();

  get minX(): number {
    return this.config.minX ? this.config.minX : 0;
  }

  get minY(): number {
    return this.config.minY ? this.config.minY : 0;
  }

  get keepInViewport(): boolean {
    return this.config.keepInViewport || false;
  }

  get maximizable(): boolean {
    return this.config.maximizable || false;
  }

  get draggable(): boolean {
    return this.config.draggable || false;
  }

  get resizable(): boolean {
    return this.config.resizable || false;
  }

  get style(): any {
    return this._style;
  }

  set style(value: any) {
    if (value) {
      this._style = { ...value };
      this.originalStyle = value;
    }
  }

  get position(): string {
    return this.config.position || '';
  }

  get parent() {
    const domElements = Array.from(
      this.document.getElementsByClassName('cps-dialog')
    );
    return domElements.length > 1 ? domElements.pop() : undefined;
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: any,
    private _dialogRef: CpsDialogRef,
    private _cdRef: ChangeDetectorRef,
    public renderer: Renderer2,
    public config: CpsDialogConfig,
    public zone: NgZone,
    public primeNGConfig: PrimeNGConfig
  ) {}

  ngAfterViewInit() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.loadChildComponent(this.childComponentType!);

    if (this.config.maximized && this.maximizable) {
      this.toggleMaximized();
    }
    this._cdRef.detectChanges();
  }

  loadChildComponent(componentType: Type<any>) {
    const viewContainerRef = this.insertionPoint?.viewContainerRef;
    viewContainerRef?.clear();

    this.componentRef = viewContainerRef?.createComponent(componentType);
    if (this._dialogRef)
      this._dialogRef.componentInstance = this.componentRef?.instance;
  }

  moveOnTop() {
    if (this.config.autoZIndex !== false) {
      ZIndexUtils.set(
        'modal',
        this.container,
        (this.config.baseZIndex || 0) + this.primeNGConfig.zIndex.modal
      );
      (this.wrapper as HTMLElement).style.zIndex = String(
        parseInt((this.container as HTMLDivElement).style.zIndex, 10) - 1
      );
    }
  }

  onAnimationStart(event: AnimationEvent) {
    switch (event.toState) {
      case 'visible':
        this.container = event.element;
        this.wrapper = (this.container as HTMLDivElement).parentElement;
        this.moveOnTop();
        if (this.parent) {
          this.unbindGlobalListeners();
        }
        this.bindGlobalListeners();

        if (this.config.modal !== false) {
          this.enableModality();
        }
        this.focus();
        break;

      case 'void':
        if (this.wrapper && this.config.modal !== false) {
          if (this.config.blurredBackground) {
            DomHandler.addClass(
              this.wrapper,
              'cps-dialog-blurred-overlay-leave'
            );
          } else DomHandler.addClass(this.wrapper, 'cps-dialog-overlay-leave');
        }
        break;
    }
  }

  onAnimationEnd(event: AnimationEvent) {
    if (event.toState === 'void') {
      this.onContainerDestroy();
      this._dialogRef.destroy();
    } else {
      this._openStateChanged.emit();
    }
  }

  onContainerDestroy() {
    this.unbindGlobalListeners();

    if (this.container && this.config.autoZIndex !== false) {
      ZIndexUtils.clear(this.container);
    }

    if (this.config.modal !== false) {
      this.disableModality();
    }
    this.container = null;
  }

  close() {
    if (this.config?.disableClose || this._dialogRef?.disableClose) return;

    this.visible = false;
    this._cdRef.markForCheck();
  }

  hide() {
    if (this.config?.disableClose) return;

    if (this._dialogRef) {
      if (!this._dialogRef.disableClose) this._dialogRef.close();
    }
  }

  enableModality() {
    if (!this.config.disableClose) {
      this.maskClickListener = this.renderer.listen(
        this.wrapper,
        'mousedown',
        (event: any) => {
          if (this.wrapper && this.wrapper.isSameNode(event.target)) {
            this.hide();
          }
        }
      );
    }

    if (this.config.modal !== false) {
      DomHandler.addClass(this.document.body, 'cps-overflow-hidden');
    }
  }

  disableModality() {
    if (this.wrapper) {
      if (!this.config.disableClose) {
        this.unbindMaskClickListener();
      }

      if (this.config.modal !== false) {
        DomHandler.removeClass(this.document.body, 'cps-overflow-hidden');
      }

      if (!(this._cdRef as ViewRef).destroyed) {
        this._cdRef.detectChanges();
      }
    }
  }

  focus() {
    const focusable = DomHandler.getFocusableElements(
      this.container as HTMLDivElement
    );
    if (focusable && focusable.length > 0) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => focusable[0].focus(), 5);
      });
    }
  }

  toggleMaximized(value?: boolean) {
    if (!this.maximizable) return;
    if (typeof value === 'boolean') {
      if (value === this.maximized || (!value && !this.maximized)) return;
      this.maximized = value;
    } else this.maximized = !this.maximized;

    if (this.maximized) {
      DomHandler.addClass(this.document.body, 'cps-overflow-hidden');
    } else {
      DomHandler.removeClass(this.document.body, 'cps-overflow-hidden');
    }

    this._maximizedStateChanged.emit(this.maximized);
  }

  initResize(event: MouseEvent) {
    if (this.resizable) {
      if (!this.documentResizeListener) {
        this.bindDocumentResizeListeners();
      }

      this.resizing = true;
      this.lastPageX = event.pageX;
      this.lastPageY = event.pageY;
      DomHandler.addClass(this.document.body, 'cps-unselectable-text');
      this._resizeStarted.emit(event);
    }
  }

  onResize(event: MouseEvent) {
    if (this.resizing) {
      const deltaX = event.pageX - (this.lastPageX as number);
      const deltaY = event.pageY - (this.lastPageY as number);
      const containerWidth = DomHandler.getOuterWidth(this.container);
      const containerHeight = DomHandler.getOuterHeight(this.container);
      const contentHeight = DomHandler.getOuterHeight(
        (<ElementRef>this.contentViewChild).nativeElement
      );
      const contentWidth = DomHandler.getOuterWidth(
        (<ElementRef>this.contentViewChild).nativeElement
      );
      const headerHeight = this.headerViewChild
        ? DomHandler.getOuterHeight(
            (<ElementRef>this.headerViewChild).nativeElement
          )
        : 0;
      const headerWidth = this.headerViewChild
        ? DomHandler.getOuterWidth(
            (<ElementRef>this.headerViewChild).nativeElement
          )
        : 0;
      let newWidth = containerWidth + deltaX;
      let newHeight = containerHeight + deltaY;
      const minWidth = (this.container as HTMLDivElement).style.minWidth;
      const minHeight = (this.container as HTMLDivElement).style.minHeight;
      const offset = (this.container as HTMLDivElement).getBoundingClientRect();
      const viewport = DomHandler.getViewport();
      const hasBeenDragged =
        !parseInt((this.container as HTMLDivElement).style.top) ||
        !parseInt((this.container as HTMLDivElement).style.left);

      if (hasBeenDragged) {
        newWidth += deltaX;
        newHeight += deltaY;
      }

      if (
        (!minWidth || newWidth > parseInt(minWidth)) &&
        offset.left + newWidth < viewport.width
      ) {
        const newContentWidth = contentWidth + newWidth - containerWidth;
        const newHeaderWidth = headerWidth + newWidth - containerWidth;
        this._style.width =
          Math.max(newWidth, newContentWidth, newHeaderWidth) + 'px';
        (this.container as HTMLDivElement).style.width = this._style.width;
      }

      if (
        (!minHeight || newHeight > parseInt(minHeight)) &&
        offset.top + newHeight < viewport.height
      ) {
        const newContentHeight = contentHeight + newHeight - containerHeight;
        this._style.height =
          Math.max(newHeight, headerHeight + newContentHeight) + 'px';
        (this.container as HTMLDivElement).style.height = this._style.height;
      }

      this.lastPageX = event.pageX;
      this.lastPageY = event.pageY;
    }
  }

  resizeEnd(event: MouseEvent) {
    if (this.resizing) {
      this.resizing = false;
      DomHandler.removeClass(this.document.body, 'cps-unselectable-text');
      this._resizeEnded.emit(event);
    }
  }

  initDrag(event: MouseEvent) {
    function isHeaderActionButton(element: HTMLElement | null): boolean {
      while (
        element &&
        !element.classList.contains('cps-dialog-header-action-button') &&
        !element.classList.contains('cps-dialog-header-info-circle')
      ) {
        element = element.parentElement;
      }

      return !!element;
    }

    if (!this.draggable || this.maximized) return;

    if (isHeaderActionButton(<HTMLElement>event.target)) return;

    this.dragging = true;
    this.lastPageX = event.pageX;
    this.lastPageY = event.pageY;

    (this.container as HTMLDivElement).style.margin = '0';
    DomHandler.addClass(this.document.body, 'cps-unselectable-text');
    this._dragStarted.emit(event);
  }

  onDrag(event: MouseEvent) {
    if (this.dragging) {
      const containerWidth = DomHandler.getOuterWidth(this.container);
      const containerHeight = DomHandler.getOuterHeight(this.container);
      const deltaX = event.pageX - (this.lastPageX as number);
      const deltaY = event.pageY - (this.lastPageY as number);
      const offset = (this.container as HTMLDivElement).getBoundingClientRect();
      const leftPos = offset.left + deltaX;
      const topPos = offset.top + deltaY;
      const viewport = DomHandler.getViewport();

      (this.container as HTMLDivElement).style.position = 'fixed';

      if (this.keepInViewport) {
        if (leftPos >= this.minX && leftPos + containerWidth < viewport.width) {
          this._style.left = leftPos + 'px';
          this.lastPageX = event.pageX;
          (this.container as HTMLDivElement).style.left = leftPos + 'px';
        }

        if (topPos >= this.minY && topPos + containerHeight < viewport.height) {
          this._style.top = topPos + 'px';
          this.lastPageY = event.pageY;
          (this.container as HTMLDivElement).style.top = topPos + 'px';
        }
      } else {
        this.lastPageX = event.pageX;
        (this.container as HTMLDivElement).style.left = leftPos + 'px';
        this.lastPageY = event.pageY;
        (this.container as HTMLDivElement).style.top = topPos + 'px';
      }
    }
  }

  endDrag(event: MouseEvent) {
    if (this.dragging) {
      this.dragging = false;
      DomHandler.removeClass(this.document.body, 'cps-unselectable-text');
      this._dragEnded.emit(event);
      this._cdRef.detectChanges();
    }
  }

  resetPosition() {
    (this.container as HTMLDivElement).style.position = '';
    (this.container as HTMLDivElement).style.left = '';
    (this.container as HTMLDivElement).style.top = '';
    (this.container as HTMLDivElement).style.margin = '';
  }

  bindDocumentDragListener() {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        this.documentDragListener = this.renderer.listen(
          this.document,
          'mousemove',
          this.onDrag.bind(this)
        );
      });
    }
  }

  bindDocumentDragEndListener() {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        this.documentDragEndListener = this.renderer.listen(
          this.document,
          'mouseup',
          this.endDrag.bind(this)
        );
      });
    }
  }

  unbindDocumentDragEndListener() {
    if (this.documentDragEndListener) {
      this.documentDragEndListener();
      this.documentDragListener = null;
    }
  }

  unbindDocumentDragListener() {
    if (this.documentDragListener) {
      this.documentDragListener();
      this.documentDragListener = null;
    }
  }

  bindDocumentResizeListeners() {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        this.documentResizeListener = this.renderer.listen(
          this.document,
          'mousemove',
          this.onResize.bind(this)
        );
        this.documentResizeEndListener = this.renderer.listen(
          this.document,
          'mouseup',
          this.resizeEnd.bind(this)
        );
      });
    }
  }

  unbindDocumentResizeListeners() {
    if (this.documentResizeListener && this.documentResizeEndListener) {
      this.documentResizeListener();
      this.documentResizeEndListener();
      this.documentResizeListener = null;
      this.documentResizeEndListener = null;
    }
  }

  bindGlobalListeners() {
    if (
      this.config.closeOnEscape !== false &&
      this.config.disableClose !== false
    ) {
      this.bindDocumentEscapeListener();
    }

    if (this.resizable) {
      this.bindDocumentResizeListeners();
    }

    if (this.draggable) {
      this.bindDocumentDragListener();
      this.bindDocumentDragEndListener();
    }
  }

  unbindGlobalListeners() {
    this.unbindDocumentEscapeListener();
    this.unbindDocumentResizeListeners();
    this.unbindDocumentDragListener();
    this.unbindDocumentDragEndListener();
  }

  bindDocumentEscapeListener() {
    const documentTarget: any = this.maskViewChild
      ? this.maskViewChild.nativeElement.ownerDocument
      : 'document';

    this.documentEscapeListener = this.renderer.listen(
      documentTarget,
      'keydown',
      (event) => {
        if (event.which === 27) {
          if (
            parseInt((this.container as HTMLDivElement).style.zIndex) ===
            ZIndexUtils.getCurrent()
          ) {
            this.hide();
          }
        }
      }
    );
  }

  unbindDocumentEscapeListener() {
    if (this.documentEscapeListener) {
      this.documentEscapeListener();
      this.documentEscapeListener = null;
    }
  }

  unbindMaskClickListener() {
    if (this.maskClickListener) {
      this.maskClickListener();
      this.maskClickListener = null;
    }
  }

  ngOnDestroy() {
    this.onContainerDestroy();
    this.componentRef?.destroy();
  }
}
