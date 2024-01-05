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
  constructor(private _notifService: CpsNotificationService) {}

  showSuccessNotification() {
    this._notifService.success('Notification message', 'Notification details');

    this._notifService.notificationClosed.subscribe(
      (data: CpsNotificationConfig) => {
        console.log('Event emitted with data:', data);
      }
    );
  }
}
