import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CpsButtonComponent,
  CpsNotificationAppearance,
  CpsNotificationConfig,
  CpsNotificationPosition,
  CpsNotificationService
} from 'cps-ui-kit';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, CpsButtonComponent],
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.scss'],
  providers: [CpsNotificationService],
  host: { class: 'composition-page' }
})
export class NotificationPageComponent {
  // eslint-disable-next-line no-useless-constructor
  constructor(private _notifService: CpsNotificationService) {
    this._notifService.notificationClosed.subscribe(
      (data: CpsNotificationConfig) => {
        console.log('Event emitted with data:', data);
      }
    );
  }

  counter = 0;
  showSuccessNotification() {
    this._notifService.success(
      `Notification message ${this.counter}`,
      'Http failure response for https://aul-dev.datassetsnp.aws.dsarena.com/aul/api-v2/domain-data-access/readonly-access-requests: 0 Unknown Error',
      {
        timeout: 0,
        position: CpsNotificationPosition.BOTTOMLEFT,
        maxWidth: '700px',
        appearance: CpsNotificationAppearance.OUTLINED
      }
    );
    this.counter += 1;
  }

  showErrorNotification() {
    this._notifService.error(`Notification message ${this.counter}`, '', {
      timeout: 0
    });
    this.counter += 1;
  }

  showWarningNotification() {
    this._notifService.warning(
      `Notification message ${this.counter}`,
      'Notification details'
    );
    this.counter += 1;
  }

  showInfoNotification() {
    this._notifService.info(
      `Notification message ${this.counter}`,
      'Notification details'
    );
    this.counter += 1;
  }

  clearNotifications() {
    this._notifService.clear();
  }
}
