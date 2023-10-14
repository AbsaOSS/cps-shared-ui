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
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  Optional,
  PLATFORM_ID,
  Renderer2,
  SkipSelf,
  Type,
  ViewChild,
  ViewEncapsulation,
  ViewRef
} from '@angular/core';
import { PrimeNGConfig, SharedModule } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
import { TimesIcon } from 'primeng/icons/times';
import { WindowMaximizeIcon } from 'primeng/icons/windowmaximize';
import { WindowMinimizeIcon } from 'primeng/icons/windowminimize';
import { ZIndexUtils } from 'primeng/utils';
import { CpsDialogConfig } from '../../cps-dialog/cps-dialog-config';
import { CpsDialogRef } from '../../cps-dialog/cps-dialog-ref';
import { CpsDialogContent } from '../../cps-dialog/cps-dialog-content';

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
  selector: 'p-dynamicDialog',
  standalone: true,
  imports: [
    CommonModule,
    WindowMaximizeIcon,
    WindowMinimizeIcon,
    TimesIcon,
    SharedModule,
    CpsDialogContent
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
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'p-element'
  }
})
export class CpsDialogComponent implements AfterViewInit, OnDestroy {
  visible = true;

  componentRef: Nullable<ComponentRef<any>>;

  mask: Nullable<HTMLDivElement>;

  resizing: boolean | undefined;

  dragging: boolean | undefined;

  maximized: boolean | undefined;

  _style: any = {};

  originalStyle: any;

  lastPageX: number | undefined;

  lastPageY: number | undefined;

  @ViewChild(CpsDialogContent)
  insertionPoint: Nullable<CpsDialogContent>;

  @ViewChild('mask') maskViewChild: Nullable<ElementRef>;

  @ViewChild('content') contentViewChild: Nullable<ElementRef>;

  @ViewChild('titlebar') headerViewChild: Nullable<ElementRef>;

  childComponentType: Nullable<Type<any>>;

  container: Nullable<HTMLDivElement>;

  wrapper: Nullable<HTMLElement>;

  documentKeydownListener!: VoidListener | null;

  documentEscapeListener!: VoidListener | null;

  maskClickListener!: VoidListener | null;

  transformOptions = 'scale(0.7)';

  documentResizeListener!: VoidListener | null;

  documentResizeEndListener!: VoidListener | null;

  documentDragListener!: VoidListener | null;

  documentDragEndListener!: VoidListener | null;

  get minX(): number {
    return this.config.minX ? this.config.minX : 0;
  }

  get minY(): number {
    return this.config.minY ? this.config.minY : 0;
  }

  get keepInViewport(): boolean {
    return this.config.keepInViewport!;
  }

  get maximizable(): boolean {
    return this.config.maximizable!;
  }

  get maximizeIcon(): string {
    return this.config.maximizeIcon!;
  }

  get minimizeIcon(): string {
    return this.config.minimizeIcon!;
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
      this.document.getElementsByClassName('p-dialog')
    );
    return domElements.length > 1 ? domElements.pop() : undefined;
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: any,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cd: ChangeDetectorRef,
    public renderer: Renderer2,
    public config: CpsDialogConfig,
    private dialogRef: CpsDialogRef,
    public zone: NgZone,
    public primeNGConfig: PrimeNGConfig,
    @SkipSelf() @Optional() private parentDialog: CpsDialogComponent
  ) {}

  ngAfterViewInit() {
    this.loadChildComponent(this.childComponentType!);
    this.cd.detectChanges();
  }

  loadChildComponent(componentType: Type<any>) {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(componentType);

    const viewContainerRef = this.insertionPoint?.viewContainerRef;
    viewContainerRef?.clear();

    this.componentRef = viewContainerRef?.createComponent(componentFactory);
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
          DomHandler.addClass(this.wrapper, 'p-component-overlay-leave');
        }
        break;
    }
  }

  onAnimationEnd(event: AnimationEvent) {
    if (event.toState === 'void') {
      this.onContainerDestroy();
      this.dialogRef.destroy();
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
    this.visible = false;
    this.cd.markForCheck();
  }

  hide() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  enableModality() {
    if (this.config.closable !== false && this.config.dismissableMask) {
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
      DomHandler.addClass(this.document.body, 'p-overflow-hidden');
    }
  }

  disableModality() {
    if (this.wrapper) {
      if (this.config.dismissableMask) {
        this.unbindMaskClickListener();
      }

      if (this.config.modal !== false) {
        DomHandler.removeClass(this.document.body, 'p-overflow-hidden');
      }

      if (!(this.cd as ViewRef).destroyed) {
        this.cd.detectChanges();
      }
    }
  }

  onKeydown(event: KeyboardEvent) {
    // tab
    if (event.which === 9) {
      event.preventDefault();

      const focusableElements = DomHandler.getFocusableElements(
        this.container as HTMLDivElement
      );
      if (focusableElements && focusableElements.length > 0) {
        if (!focusableElements[0].ownerDocument.activeElement) {
          focusableElements[0].focus();
        } else {
          const focusedIndex = focusableElements.indexOf(
            focusableElements[0].ownerDocument.activeElement
          );

          if (event.shiftKey) {
            if (focusedIndex === -1 || focusedIndex === 0)
              focusableElements[focusableElements.length - 1].focus();
            else focusableElements[focusedIndex - 1].focus();
          } else {
            if (
              focusedIndex === -1 ||
              focusedIndex === focusableElements.length - 1
            )
              focusableElements[0].focus();
            else focusableElements[focusedIndex + 1].focus();
          }
        }
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

  maximize() {
    this.maximized = !this.maximized;

    if (this.maximized) {
      DomHandler.addClass(this.document.body, 'p-overflow-hidden');
    } else {
      DomHandler.removeClass(this.document.body, 'p-overflow-hidden');
    }

    this.dialogRef.maximize({ maximized: this.maximized });
  }

  initResize(event: MouseEvent) {
    if (this.config.resizable) {
      if (!this.documentResizeListener) {
        this.bindDocumentResizeListeners();
      }

      this.resizing = true;
      this.lastPageX = event.pageX;
      this.lastPageY = event.pageY;
      DomHandler.addClass(this.document.body, 'p-unselectable-text');
      this.dialogRef.resizeInit(event);
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
        this._style.width = newWidth + 'px';
        (this.container as HTMLDivElement).style.width = this._style.width;
      }

      if (
        (!minHeight || newHeight > parseInt(minHeight)) &&
        offset.top + newHeight < viewport.height
      ) {
        (<ElementRef>this.contentViewChild).nativeElement.style.height =
          contentHeight + newHeight - containerHeight + 'px';

        if (this._style.height) {
          this._style.height = newHeight + 'px';
          (this.container as HTMLDivElement).style.height = this._style.height;
        }
      }

      this.lastPageX = event.pageX;
      this.lastPageY = event.pageY;
    }
  }

  resizeEnd(event: MouseEvent) {
    if (this.resizing) {
      this.resizing = false;
      DomHandler.removeClass(this.document.body, 'p-unselectable-text');
      this.dialogRef.resizeEnd(event);
    }
  }

  initDrag(event: MouseEvent) {
    if (
      DomHandler.hasClass(event.target, 'p-dialog-header-icon') ||
      DomHandler.hasClass(
        (<HTMLElement>event.target).parentElement,
        'p-dialog-header-icon'
      )
    ) {
      return;
    }

    if (this.config.draggable) {
      this.dragging = true;
      this.lastPageX = event.pageX;
      this.lastPageY = event.pageY;

      (this.container as HTMLDivElement).style.margin = '0';
      DomHandler.addClass(this.document.body, 'p-unselectable-text');
      this.dialogRef.dragStart(event);
    }
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
      DomHandler.removeClass(this.document.body, 'p-unselectable-text');
      this.dialogRef.dragEnd(event);
      this.cd.detectChanges();
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
    if (this.parentDialog) {
      this.parentDialog.unbindDocumentKeydownListener();
    }
    this.bindDocumentKeydownListener();

    if (this.config.closeOnEscape !== false && this.config.closable !== false) {
      this.bindDocumentEscapeListener();
    }

    if (this.config.resizable) {
      this.bindDocumentResizeListeners();
    }

    if (this.config.draggable) {
      this.bindDocumentDragListener();
      this.bindDocumentDragEndListener();
    }
  }

  unbindGlobalListeners() {
    this.unbindDocumentKeydownListener();
    this.unbindDocumentEscapeListener();
    this.unbindDocumentResizeListeners();
    this.unbindDocumentDragListener();
    this.unbindDocumentDragEndListener();

    if (this.parentDialog) {
      this.parentDialog.bindDocumentKeydownListener();
    }
  }

  bindDocumentKeydownListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.documentKeydownListener) {
        this.zone.runOutsideAngular(() => {
          this.documentKeydownListener = this.renderer.listen(
            this.document,
            'keydown',
            this.onKeydown.bind(this)
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

    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
