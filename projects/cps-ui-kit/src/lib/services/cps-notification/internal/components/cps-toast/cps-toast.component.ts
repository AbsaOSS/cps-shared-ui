import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CommonModule } from '@angular/common';
import {
  CpsNotificationConfig,
  CpsNotificationType
} from '../../../utils/cps-notification-config';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

@Component({
  standalone: true,
  imports: [CommonModule, CpsButtonComponent, CpsIconComponent],
  selector: 'cps-toast',
  templateUrl: './cps-toast.component.html',
  styleUrls: ['./cps-toast.component.scss'],
  animations: [
    trigger('messageState', [
      state(
        'visible',
        style({
          transform: 'translateY(0)',
          opacity: 1
        })
      ),
      transition('void => *', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('200ms ease-out')
      ]),
      transition('* => void', [
        animate(
          '200ms ease-in',
          style({
            height: 0,
            opacity: 0,
            transform: 'translateY(-100%)'
          })
        )
      ])
    ])
  ]
})
export class CpsToastComponent {
  @Input() data!: CpsNotificationConfig;

  /**
   * Callback to invoke on toast close.
   * @param {any}
   * @group Emits
   */
  @Output() closed = new EventEmitter();

  close() {
    this.closed.emit();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearTimeout() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initiateTimeout() {}

  colorName(): string {
    return this.data.type === CpsNotificationType.WARNING
      ? 'warn'
      : this.data.type || CpsNotificationType.ERROR;
  }
}
