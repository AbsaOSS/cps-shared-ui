import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy
} from '@angular/core';
import { SharedModule } from '../../../../../primeng-temp/api/public_api';
import { ZIndexUtils } from '../../../../../primeng-temp/utils/public_api';
import {
  type CpsNotificationConfig,
  CpsNotificationPosition
} from '../../../utils/cps-notification-config';
import type { CpsNotificationData } from '../../../utils/internal/cps-notification-data';
import { CpsToastComponent } from '../cps-toast/cps-toast.component';
import { animateChild, query, transition, trigger } from '@angular/animations';
import { PrimeNG } from '../../../../../primeng-temp/config/public_api';

type Nullable<T = void> = T | null | undefined;

@Component({
  selector: 'cps-notification-container',
  imports: [SharedModule, CpsToastComponent],
  templateUrl: './cps-notification-container.component.html',
  styleUrls: ['./cps-notification-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
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
   * Callback to invoke when a notification is closed.
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

  private readonly _primeNG = inject(PrimeNG);
  private readonly _cdRef = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    this.wrapper = (
      this.container?.nativeElement as HTMLDivElement
    ).parentElement;
    this.moveOnTop();
  }

  addNotification(config: CpsNotificationConfig, data: CpsNotificationData) {
    if (!config.allowDuplicates) {
      const duplicate = this.notifications.find(
        (notification) =>
          notification.data.message === data.message &&
          notification.data.details === data.details
      );
      if (duplicate) return;
    }

    if (
      this.notifications.length > 0 &&
      this.notifications.length === config.maxAmount
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
      this._primeNG.zIndex.modal
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
