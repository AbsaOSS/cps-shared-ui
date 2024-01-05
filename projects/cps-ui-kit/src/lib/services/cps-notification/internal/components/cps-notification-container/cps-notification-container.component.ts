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
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { PrimeNGConfig, SharedModule } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
import { ZIndexUtils } from 'primeng/utils';
import {
  CpsNotificationConfig,
  CpsNotificationPosition
} from '../../../utils/cps-notification-config';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsInfoCircleComponent } from '../../../../../components/cps-info-circle/cps-info-circle.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CpsToastComponent } from '../cps-toast/cps-toast.component';

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
    CpsButtonComponent,
    CpsInfoCircleComponent,
    CpsIconComponent,
    CpsToastComponent
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
  /**
   * Position of the notification container.
   * @group Props
   */
  @Input() position = CpsNotificationPosition.TOPRIGHT;

  /**
   * Max amount of notifications to be displayed within the container.
   * @group Props
   */
  @Input() maxAmount?: number;

  /**
   * Callback to invoke on notification close.
   * @param {CpsNotificationConfig} CpsNotificationConfig - notification closed.
   * @group Emits
   */
  @Output() closed = new EventEmitter<CpsNotificationConfig>();

  CpsNotificationPosition = CpsNotificationPosition;

  visible = true;

  componentRef: Nullable<ComponentRef<any>>;

  _style: any = {};

  originalStyle: any;

  @ViewChild('mask') maskViewChild: Nullable<ElementRef>;

  container: Nullable<HTMLDivElement>;

  wrapper: Nullable<HTMLElement>;

  documentEscapeListener!: VoidListener | null;

  maskClickListener!: VoidListener | null;

  transformOptions = 'scale(0.7)';

  _openStateChanged = new EventEmitter<void>();

  notifications: CpsNotificationConfig[] = [];

  get style(): any {
    return this._style;
  }

  set style(value: any) {
    if (value) {
      this._style = { ...value };
      this.originalStyle = value;
    }
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
    private _cdRef: ChangeDetectorRef,
    public renderer: Renderer2,
    public zone: NgZone,
    public primeNGConfig: PrimeNGConfig
  ) {}

  ngAfterViewInit() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._cdRef.detectChanges();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addNotification(notification: CpsNotificationConfig) {
    this.notifications.push(notification);
  }

  onCloseNotification(notification: CpsNotificationConfig) {
    this.notifications = this.notifications.filter(
      (ntf) => ntf !== notification
    );
    this.closed.emit(notification);
  }

  moveOnTop() {
    ZIndexUtils.set('modal', this.container, this.primeNGConfig.zIndex.modal);
    (this.wrapper as HTMLElement).style.zIndex = String(
      parseInt((this.container as HTMLDivElement).style.zIndex, 10) - 1
    );
  }

  onAnimationStart(event: AnimationEvent) {
    switch (event.toState) {
      case 'visible':
        this.container = event.element;
        this.wrapper = (this.container as HTMLDivElement).parentElement;
        this.moveOnTop();
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
    } else {
      this._openStateChanged.emit();
    }
  }

  onContainerDestroy() {
    if (this.container) {
      ZIndexUtils.clear(this.container);
    }
    this.container = null;
  }

  close() {
    this.visible = false;
    this._cdRef.markForCheck();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  hide() {}

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
