// import { Component } from '@angular/core';
// import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
// import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
// import { CpsNotificationRef } from '../../../utils/cps-notification-ref';
// import { CpsNotificationConfig } from '../../../utils/cps-notification-config';
// import { CommonModule } from '@angular/common';

// @Component({
//   standalone: true,
//   imports: [CommonModule, CpsButtonComponent, CpsIconComponent],
//   selector: 'cps-toast',
//   templateUrl: './cps-toast.component.html',
//   styleUrls: ['./cps-toast.component.scss']
// })
// export class CpsToastComponent {
//   subtitle = '';

//   // eslint-disable-next-line no-useless-constructor
//   constructor(
//     private _notifRef: CpsNotificationRef,
//     private _config: CpsNotificationConfig
//   ) {
//     // this.subtitle = this._config.data.subtitle;
//   }

//   close() {
//     this._notifRef?.close(true);
//   }

//   // eslint-disable-next-line @typescript-eslint/no-empty-function
//   clearTimeout() {}

//   // eslint-disable-next-line @typescript-eslint/no-empty-function
//   initiateTimeout() {}

//   className() {
//     return 'success';
//   }

//   iconName() {
//     return 'toast-success';
//   }
// }
