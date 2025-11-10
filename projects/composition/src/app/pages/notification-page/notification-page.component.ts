import { Component } from '@angular/core';
import {
  CpsButtonComponent,
  CpsNotificationAppearance,
  CpsNotificationPosition,
  CpsNotificationService
} from 'cps-ui-kit';

import ServiceData from '../../api-data/cps-notification.json';
import { ServiceDocsViewerComponent } from '../../components/service-docs-viewer/service-docs-viewer.component';

@Component({
  selector: 'app-notification-page',
  imports: [CpsButtonComponent, ServiceDocsViewerComponent],
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.scss'],
  host: { class: 'composition-page' }
})
export class NotificationPageComponent {
  serviceData = ServiceData;
  // eslint-disable-next-line no-useless-constructor
  constructor(private _notifService: CpsNotificationService) {}

  counter = 0;
  showSuccessNotification() {
    this._notifService.success(`Notification message ${this.counter}`);
    this.counter += 1;
  }

  showErrorNotification() {
    this._notifService.error(`Notification message ${this.counter}`);
    this.counter += 1;
  }

  showWarningNotification() {
    this._notifService.warning(`Notification message ${this.counter}`);
    this.counter += 1;
  }

  showInfoNotification() {
    this._notifService.info(`Notification message ${this.counter}`);
    this.counter += 1;
  }

  showInfoNotificationWithDetails() {
    this._notifService.info(
      `Notification message ${this.counter}`,
      'Notification details',
      { position: CpsNotificationPosition.BOTTOM }
    );
    this.counter += 1;
  }

  showOutlinedBottomLeftPersistentSuccessNotification() {
    this._notifService.success(`Notification message ${this.counter}`, '', {
      timeout: 0,
      position: CpsNotificationPosition.BOTTOMLEFT,
      appearance: CpsNotificationAppearance.OUTLINED
    });
    this.counter += 1;
  }

  showOutlinedBottomRight2sTimeoutWarningNotification() {
    this._notifService.warning(
      `Notification message ${this.counter}`,
      'Notifications details',
      {
        timeout: 2000,
        position: CpsNotificationPosition.BOTTOMRIGHT,
        appearance: CpsNotificationAppearance.OUTLINED
      }
    );
    this.counter += 1;
  }

  showErrorRightWithMax3Notification() {
    this._notifService.error(
      `Notification message ${this.counter}`,
      'Http failure response for https://my-long-url/epic/fail: 404 Not Found Error',
      {
        position: CpsNotificationPosition.RIGHT,
        maxWidth: '450px',
        maxAmount: 3
      }
    );
    this.counter += 1;
  }

  clearNotifications() {
    this._notifService.clear();
  }
}
