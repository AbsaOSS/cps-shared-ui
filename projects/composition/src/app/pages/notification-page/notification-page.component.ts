import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CpsButtonComponent,
  CpsNotificationConfig,
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
      'Notification details',
      { timeout: 0 }
    );
    this.counter += 1;
  }

  showErrorNotification() {
    this._notifService.error(
      `Notification message ${this.counter}`,
      'Notification details'
    );
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
}
