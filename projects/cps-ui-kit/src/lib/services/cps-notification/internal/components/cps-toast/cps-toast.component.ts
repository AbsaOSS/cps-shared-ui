import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CommonModule } from '@angular/common';
import { CpsNotificationConfig } from '../../../utils/cps-notification-config';

@Component({
  standalone: true,
  imports: [CommonModule, CpsButtonComponent, CpsIconComponent],
  selector: 'cps-toast',
  templateUrl: './cps-toast.component.html',
  styleUrls: ['./cps-toast.component.scss']
})
export class CpsToastComponent {
  @Input() data!: CpsNotificationConfig;

  subtitle = '';

  /**
   * Callback to invoke on toast close.
   * @param {any}
   * @group Emits
   */
  @Output() closed = new EventEmitter();

  // eslint-disable-next-line no-useless-constructor
  constructor() {
    this.subtitle = 'Hello'; // this._config.data.subtitle;
  }

  close() {
    this.closed.emit();
    // this._notifRef?.close(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearTimeout() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initiateTimeout() {}

  className() {
    return 'success';
  }

  iconName() {
    return 'toast-success';
  }
}
