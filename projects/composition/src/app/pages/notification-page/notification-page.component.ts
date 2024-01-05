import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsButtonComponent, CpsNotificationService } from 'cps-ui-kit';

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
    const notificationRef = this._notifService.success(
      'Notification message',
      'Notification details'
    );

    notificationRef.onClose.subscribe((result: boolean) => {
      console.log(result);
    });
  }
}
