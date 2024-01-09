import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
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
import { CpsNotificationData } from '../../../utils/internal/cps-notification-data';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsInfoCircleComponent } from '../../../../../components/cps-info-circle/cps-info-circle.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CpsToastComponent } from '../cps-toast/cps-toast.component';
import { animateChild, query, transition, trigger } from '@angular/animations';

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
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('notificationAnimation', [
      transition(':enter, :leave', [query('@*', animateChild())])
    ])
  ]
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
  @Output() closed = new EventEmitter();

  CpsNotificationPosition = CpsNotificationPosition;

  @ViewChild('container') container: Nullable<ElementRef>;

  wrapper: Nullable<HTMLElement>;

  notifications: {
    data: CpsNotificationData;
    config: CpsNotificationConfig;
  }[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(
    public renderer: Renderer2,
    public zone: NgZone,
    public primeNGConfig: PrimeNGConfig,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.wrapper = (
      this.container?.nativeElement as HTMLDivElement
    ).parentElement;
    this.moveOnTop();
  }

  addNotification(config: CpsNotificationConfig, data: CpsNotificationData) {
    if (
      this.notifications.length > 0 &&
      this.notifications.length === this.maxAmount
    ) {
      this.notifications.pop();
    }
    this.notifications.unshift({ data, config });
  }

  onCloseNotification(index: number) {
    this.notifications.splice(index, 1);
    this.closed.emit();
    this._cdRef.detectChanges();
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
