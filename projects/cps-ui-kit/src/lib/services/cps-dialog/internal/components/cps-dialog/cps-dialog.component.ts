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
  inject,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  Type,
  ViewChild,
  ViewEncapsulation,
  ViewRef
} from '@angular/core';
import { SharedModule } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
import { ZIndexUtils } from 'primeng/utils';
import { PrimeNG } from 'primeng/config';
import {
  convertSize,
  parseSize
} from '../../../../../utils/internal/size-utils';
import { CpsDialogContentDirective } from '../../directives/cps-dialog-content.directive';
import { CpsDialogConfig } from '../../../utils/cps-dialog-config';
import { CpsDialogRef } from '../../../utils/cps-dialog-ref';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsInfoCircleComponent } from '../../../../../components/cps-info-circle/cps-info-circle.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CPS_FOCUS_SERVICE } from '../../../../cps-focus/cps-focus.service';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../../../cps-root-font-size/cps-root-font-size.service';

const showAnimation = animation([
  style({ transform: '{{transform}}', opacity: 0 }),
  animate('{{transition}}', style({ transform: 'none', opacity: 1 }))
]);

const hideAnimation = animation([
  animate('{{transition}}', style({ transform: '{{transform}}', opacity: 0 }))
]);

type Nullable<T = void> = T | null | undefined;
type VoidListener = () => void | null | undefined;

const MIN_DRAG_VISIBLE_REM = 3;

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
export class CpsDialogComponent implements OnInit, AfterViewInit, OnDestroy {
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
  @ViewChild('dragHandle', { read: ElementRef })
  dragHandleViewChild: Nullable<ElementRef>;

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

  private _focusTrapTeardown: (() => void) | null = null;
  private _keyboardDragging = false;
  private _keyboardResizing = false;
  private _previouslyFocusedElement: HTMLElement | null = null;
  private _shouldRestoreFocus = false;

  _openStateChanged = new EventEmitter<void>();
  _dragStarted = new EventEmitter<MouseEvent | KeyboardEvent>();
  _dragEnded = new EventEmitter<MouseEvent | KeyboardEvent>();
  _resizeStarted = new EventEmitter<MouseEvent | KeyboardEvent>();
  _resizeEnded = new EventEmitter<MouseEvent | KeyboardEvent>();
  _maximizedStateChanged = new EventEmitter<boolean>();

  private _openedByKeyboard = false;
  private readonly _cpsFocusService = inject(CPS_FOCUS_SERVICE);
  private readonly _cpsRootFontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);
  private get _rootFontSizePx(): number {
    return this._cpsRootFontSizeService?.fontSize() ?? 16;
  }

  get ariaLabel(): string | null {
    if (this.config.ariaLabelledBy) return null;
    return this.config.ariaLabel || this.config.headerTitle || null;
  }

  get cvtWidth(): string {
    return convertSize(this.config.width);
  }

  get cvtHeight(): string {
    return convertSize(this.config.height);
  }

  get cvtMinWidth(): string {
    return convertSize(this.config.minWidth);
  }

  get cvtMinHeight(): string {
    return convertSize(this.config.minHeight);
  }

  get cvtMaxWidth(): string {
    return this.maximized ? '' : convertSize(this.config.maxWidth);
  }

  get cvtMaxHeight(): string {
    return this.maximized ? '' : convertSize(this.config.maxHeight);
  }

  get minX(): number {
    return this._toPx(this.config.minX);
  }

  get minY(): number {
    return this._toPx(this.config.minY);
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
    @Inject(PLATFORM_ID) private platformId: object,
    private _dialogRef: CpsDialogRef,
    private _cdRef: ChangeDetectorRef,
    public renderer: Renderer2,
    public config: CpsDialogConfig,
    public zone: NgZone,
    public primeNG: PrimeNG
  ) {}

  ngOnInit(): void {
    if (
      !this.config.ariaLabel?.trim() &&
      !this.config.ariaLabelledBy?.trim() &&
      !this.config.headerTitle?.trim()
    ) {
      console.warn(
        'CpsDialogComponent: dialog has no accessible name. Provide ariaLabel, ariaLabelledBy, or headerTitle.'
      );
    }
  }

  ngAfterViewInit() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.loadChildComponent(this.childComponentType!);

    if (this.config.maximized && this.maximizable) {
      this.toggleMaximized();
    }
    this._cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.onContainerDestroy();
    this.componentRef?.destroy();
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
        (this.config.baseZIndex || 0) + this.primeNG.zIndex.modal
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
        this._previouslyFocusedElement = this.document
          .activeElement as HTMLElement;
        this._openedByKeyboard = this._cpsFocusService?.isKeyboard() ?? false;
        this.moveOnTop();
        if (this.parent) {
          this.unbindGlobalListeners();
        }
        this.bindGlobalListeners();

        if (this.config.modal !== false) {
          this.enableModality();
        }
        break;

      case 'void':
        this._shouldRestoreFocus =
          this.config.modal !== false ||
          !!this.container?.contains(this.document.activeElement);
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
      this.focus(() => this._openStateChanged.emit());
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

    if (
      this._shouldRestoreFocus &&
      this._previouslyFocusedElement?.isConnected
    ) {
      if (this._cpsFocusService) {
        this._cpsFocusService.focusElement(
          this._previouslyFocusedElement,
          this._openedByKeyboard
        );
      } else {
        this._previouslyFocusedElement.focus();
      }
    }
    this._previouslyFocusedElement = null;
  }

  isCloseDisabled() {
    return !!this.config?.disableClose || !!this._dialogRef?.disableClose;
  }

  close() {
    if (this.isCloseDisabled()) return;
    this.visible = false;
    this._cdRef.markForCheck();
  }

  hide() {
    if (this.isCloseDisabled()) return;
    this._dialogRef?.close();
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

  focus(afterFocus?: () => void) {
    const autoFocus = this.config.autoFocus ?? true;
    if (autoFocus === false) {
      afterFocus?.();
      return;
    }

    const containerEl = this.container as HTMLDivElement | null;
    if (!containerEl) {
      afterFocus?.();
      return;
    }

    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        let handled = false;

        if (autoFocus === 'dialog') {
          containerEl.focus();
          handled = true;
        } else if (
          typeof autoFocus === 'string' &&
          autoFocus !== 'first-tabbable'
        ) {
          const target = containerEl.querySelector<HTMLElement>(autoFocus);
          if (target) {
            target.focus();
            handled = true;
          }
        }

        if (!handled) {
          // 'first-tabbable', true (default), or selector not found
          const focusable: HTMLElement[] =
            DomHandler.getFocusableElements(containerEl);
          if (focusable && focusable.length > 0) {
            focusable[0].focus();
          } else {
            containerEl.focus();
          }
        }

        if (afterFocus) this.zone.run(afterFocus);
      }, 5);
    });
  }

  onResizeHandleKeydown(event: KeyboardEvent): void {
    if (!this.resizable || this.maximized) return;
    if (
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    )
      return;

    event.preventDefault();

    const handleEl = event.target as HTMLElement;
    this.renderer.addClass(handleEl, 'cps-dialog-resizable-handle-resizing');
    if (!this._keyboardResizing) {
      this._keyboardResizing = true;
      this._resizeStarted.emit(event);
    }

    const containerEl = this.container as HTMLDivElement;
    const step = this._rootFontSizePx;

    let newWidth = DomHandler.getOuterWidth(containerEl);
    let newHeight = DomHandler.getOuterHeight(containerEl);

    if (event.key === 'ArrowRight') newWidth += step;
    else if (event.key === 'ArrowLeft') newWidth -= step;
    else if (event.key === 'ArrowDown') newHeight += step;
    else if (event.key === 'ArrowUp') newHeight -= step;

    const viewport = DomHandler.getViewport();
    const offset = containerEl.getBoundingClientRect();

    newWidth = Math.min(newWidth, viewport.width - offset.left);
    newHeight = Math.min(newHeight, viewport.height - offset.top);

    this._style.width = this._pxToRem(newWidth);
    this._style.height = this._pxToRem(newHeight);
    containerEl.style.width = this._pxToRem(newWidth);
    containerEl.style.height = this._pxToRem(newHeight);
  }

  onResizeHandleKeyup(event: KeyboardEvent): void {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      this.renderer.removeClass(
        event.target as HTMLElement,
        'cps-dialog-resizable-handle-resizing'
      );
      this._keyboardResizing = false;
      this._resizeEnded.emit(event);
    }
  }

  onHeaderKeyup(event: KeyboardEvent): void {
    if (
      this.dragHandleViewChild?.nativeElement?.contains(event.target as Node) &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      const headerEl = this.headerViewChild
        ?.nativeElement as HTMLElement | null;
      if (headerEl)
        this.renderer.removeClass(headerEl, 'cps-dialog-header-moving');
      this._keyboardDragging = false;
      this._dragEnded.emit(event);
    }
  }

  onHeaderKeydown(event: KeyboardEvent): void {
    if (!this.draggable || this.maximized) return;
    if (
      !this.dragHandleViewChild?.nativeElement?.contains(event.target as Node)
    )
      return;
    if (
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    )
      return;

    event.preventDefault();

    const headerEl = this.headerViewChild?.nativeElement as HTMLElement | null;
    if (headerEl) this.renderer.addClass(headerEl, 'cps-dialog-header-moving');
    if (!this._keyboardDragging) {
      this._keyboardDragging = true;
      this._dragStarted.emit(event);
    }

    const containerEl = this.container as HTMLDivElement;
    const step = this._rootFontSizePx;
    const offset = containerEl.getBoundingClientRect();

    containerEl.style.position = 'fixed';
    containerEl.style.margin = '0';

    let newLeft = offset.left;
    let newTop = offset.top;

    if (event.key === 'ArrowLeft') newLeft -= step;
    else if (event.key === 'ArrowRight') newLeft += step;
    else if (event.key === 'ArrowUp') newTop -= step;
    else if (event.key === 'ArrowDown') newTop += step;

    if (this.keepInViewport) {
      const containerWidth = DomHandler.getOuterWidth(containerEl);
      const containerHeight = DomHandler.getOuterHeight(containerEl);
      const viewport = DomHandler.getViewport();
      newLeft = Math.max(
        this.minX,
        Math.min(newLeft, viewport.width - containerWidth)
      );
      newTop = Math.max(
        this.minY,
        Math.min(newTop, viewport.height - containerHeight)
      );
    } else {
      const containerWidth = DomHandler.getOuterWidth(containerEl);
      ({ left: newLeft, top: newTop } = this._clampDragPos(
        newLeft,
        newTop,
        containerWidth
      ));
    }

    this._style.left = this._pxToRem(newLeft);
    this._style.top = this._pxToRem(newTop);
    containerEl.style.left = this._pxToRem(newLeft);
    containerEl.style.top = this._pxToRem(newTop);
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
      const offset = (this.container as HTMLDivElement).getBoundingClientRect();
      const viewport = DomHandler.getViewport();
      const hasBeenDragged =
        !parseInt((this.container as HTMLDivElement).style.top) ||
        !parseInt((this.container as HTMLDivElement).style.left);

      if (hasBeenDragged) {
        newWidth += deltaX;
        newHeight += deltaY;
      }

      if (offset.left + newWidth < viewport.width) {
        const newContentWidth = contentWidth + newWidth - containerWidth;
        const newHeaderWidth = headerWidth + newWidth - containerWidth;
        this._style.width = this._pxToRem(
          Math.max(newWidth, newContentWidth, newHeaderWidth)
        );
        (this.container as HTMLDivElement).style.width = this._style.width;
      }

      if (offset.top + newHeight < viewport.height) {
        const newContentHeight = contentHeight + newHeight - containerHeight;
        this._style.height = this._pxToRem(
          Math.max(newHeight, headerHeight + newContentHeight)
        );
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
          this._style.left = this._pxToRem(leftPos);
          this.lastPageX = event.pageX;
          (this.container as HTMLDivElement).style.left =
            this._pxToRem(leftPos);
        }

        if (topPos >= this.minY && topPos + containerHeight < viewport.height) {
          this._style.top = this._pxToRem(topPos);
          this.lastPageY = event.pageY;
          (this.container as HTMLDivElement).style.top = this._pxToRem(topPos);
        }
      } else {
        const clamped = this._clampDragPos(leftPos, topPos, containerWidth);
        this.lastPageX = event.pageX;
        (this.container as HTMLDivElement).style.left = this._pxToRem(
          clamped.left
        );
        this.lastPageY = event.pageY;
        (this.container as HTMLDivElement).style.top = this._pxToRem(
          clamped.top
        );
        this._style.left = this._pxToRem(clamped.left);
        this._style.top = this._pxToRem(clamped.top);
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

    if (this.config.modal !== false) {
      this.bindFocusTrapListener();
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
    this.unbindFocusTrapListener();
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
        if (event.key === 'Escape') {
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

  bindFocusTrapListener() {
    if (!isPlatformBrowser(this.platformId) || !this.container) return;
    if (this._cpsFocusService) {
      this._focusTrapTeardown = this._cpsFocusService.trapFocus(
        this.container,
        (el) => DomHandler.getFocusableElements(el)
      );
    }
  }

  unbindFocusTrapListener() {
    this._focusTrapTeardown?.();
    this._focusTrapTeardown = null;
  }

  unbindMaskClickListener() {
    if (this.maskClickListener) {
      this.maskClickListener();
      this.maskClickListener = null;
    }
  }

  private _pxToRem(px: number): string {
    return `${px / this._rootFontSizePx}rem`;
  }

  private _toPx(
    size: number | string | null | undefined,
    fallback = 0
  ): number {
    if (size == null) return fallback;
    if (typeof size === 'number') return size;
    const parsed = parseSize(convertSize(size));
    if (!parsed) return fallback;
    if (parsed.unit === 'px') return parsed.value;
    if (parsed.unit === 'rem') return parsed.value * this._rootFontSizePx;
    throw new Error(
      `Unsupported unit "${parsed.unit}" in dialog config. Use px or rem.`
    );
  }

  private _clampDragPos(
    left: number,
    top: number,
    containerWidth: number
  ): { left: number; top: number } {
    const { width, height } = DomHandler.getViewport();
    const m = MIN_DRAG_VISIBLE_REM * this._rootFontSizePx;
    return {
      left: Math.max(m - containerWidth, Math.min(left, width - m)),
      top: Math.max(0, Math.min(top, height - m))
    };
  }
}
