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
import { ZIndexUtils } from 'primeng/utils';
import {
  CpsNotificationConfig,
  CpsNotificationPosition
} from '../../../utils/cps-notification-config';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsInfoCircleComponent } from '../../../../../components/cps-info-circle/cps-info-circle.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CpsToastComponent } from '../cps-toast/cps-toast.component';

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

  componentRef: Nullable<ComponentRef<any>>;

  _style: any = {};

  originalStyle: any;

  @ViewChild('mask') maskViewChild: Nullable<ElementRef>;

  @ViewChild('container') container: Nullable<ElementRef>;

  wrapper: Nullable<HTMLElement>;

  documentEscapeListener!: VoidListener | null;

  maskClickListener!: VoidListener | null;

  transformOptions = 'scale(0.7)';

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
    this.wrapper = (
      this.container?.nativeElement as HTMLDivElement
    ).parentElement;
    this.moveOnTop();
    // this._cdRef.detectChanges();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addNotification(notification: CpsNotificationConfig) {
    this.notifications.push(notification);
  }

  onCloseNotification(notification: CpsNotificationConfig, index: number) {
    this.notifications.splice(index, 1);
    // this.notifications = this.notifications.filter(
    //   (ntf) => ntf !== notification
    // );
    this.closed.emit(notification);
  }

  moveOnTop() {
    ZIndexUtils.set(
      'modal',
      this.container?.nativeElement,
      this.primeNGConfig.zIndex.modal
    );
    (this.wrapper as HTMLElement).style.zIndex = String(
      parseInt(
        (this.container?.nativeElement as HTMLDivElement).style.zIndex,
        10
      ) - 1
    );
  }

  onContainerDestroy() {
    if (this.container?.nativeElement) {
      ZIndexUtils.clear(this.container.nativeElement);
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
