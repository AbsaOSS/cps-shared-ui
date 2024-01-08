import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
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

  @ViewChild('container') container: Nullable<ElementRef>;

  wrapper: Nullable<HTMLElement>;

  notifications: CpsNotificationConfig[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(
    public renderer: Renderer2,
    public zone: NgZone,
    public primeNGConfig: PrimeNGConfig
  ) {}

  ngAfterViewInit() {
    this.wrapper = (
      this.container?.nativeElement as HTMLDivElement
    ).parentElement;
    this.moveOnTop();
  }

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

  ngOnDestroy() {
    if (this.container?.nativeElement) {
      ZIndexUtils.clear(this.container.nativeElement);
    }
  }
}
