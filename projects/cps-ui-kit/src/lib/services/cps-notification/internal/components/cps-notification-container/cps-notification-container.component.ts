import {
  animate,
  animation,
  AnimationEvent,
  style,
  transition,
  trigger,
  useAnimation
} from '@angular/animations';
import { CommonModule, DOCUMENT } from '@angular/common';
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
  ViewEncapsulation
} from '@angular/core';
import { PrimeNGConfig, SharedModule } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
import { ZIndexUtils } from 'primeng/utils';
import { CpsNotificationContentDirective } from '../../directives/cps-notification-content.directive';
import { CpsNotificationConfig } from '../../../utils/cps-notification-config';
import { CpsNotificationRef } from '../../../utils/cps-notification-ref';
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
  selector: 'cps-notification-container',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    CpsNotificationContentDirective,
    CpsButtonComponent,
    CpsInfoCircleComponent,
    CpsIconComponent
  ],
  templateUrl: './cps-notification-container.component.html',
  styleUrls: ['./cps-notification-container.component.scss'],
  animations: [
    trigger('animation', [
      transition('void => visible', [useAnimation(showAnimation)]),
      transition('visible => void', [useAnimation(hideAnimation)])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None
})
export class CpsNotificationContainerComponent
  implements AfterViewInit, OnDestroy
{
  visible = true;

  componentRef: Nullable<ComponentRef<any>>;

  _style: any = {};

  originalStyle: any;

  @ViewChild(CpsNotificationContentDirective)
  insertionPoint: Nullable<CpsNotificationContentDirective>;

  @ViewChild('mask') maskViewChild: Nullable<ElementRef>;
  @ViewChild('content') contentViewChild: Nullable<ElementRef>;

  childComponentType: Nullable<Type<any>>;

  container: Nullable<HTMLDivElement>;

  wrapper: Nullable<HTMLElement>;

  documentEscapeListener!: VoidListener | null;

  maskClickListener!: VoidListener | null;

  transformOptions = 'scale(0.7)';

  _openStateChanged = new EventEmitter<void>();

  get keepInViewport(): boolean {
    return this.config.keepInViewport || false;
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
    private _dialogRef: CpsNotificationRef,
    private _cdRef: ChangeDetectorRef,
    public renderer: Renderer2,
    public config: CpsNotificationConfig,
    public zone: NgZone,
    public primeNGConfig: PrimeNGConfig
  ) {}

  ngAfterViewInit() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.loadChildComponent(this.childComponentType!);
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
        this.focus();
        break;

      case 'void':
      default:
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

  bindGlobalListeners() {
    if (
      this.config.closeOnEscape !== false &&
      this.config.disableClose !== false
    ) {
      this.bindDocumentEscapeListener();
    }
  }

  unbindGlobalListeners() {
    this.unbindDocumentEscapeListener();
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
