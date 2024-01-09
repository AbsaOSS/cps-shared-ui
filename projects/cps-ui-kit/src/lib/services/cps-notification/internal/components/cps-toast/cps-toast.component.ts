import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CpsButtonComponent } from '../../../../../components/cps-button/cps-button.component';
import { CpsIconComponent } from '../../../../../components/cps-icon/cps-icon.component';
import { CommonModule } from '@angular/common';
import { convertSize } from '../../../../../utils/internal/size-utils';
import {
  CpsNotificationAppearance,
  CpsNotificationConfig
} from '../../../utils/cps-notification-config';
import {
  CpsNotificationData,
  CpsNotificationType
} from '../../../utils/internal/cps-notification-data';
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
    trigger('toastState', [
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
export class CpsToastComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config!: CpsNotificationConfig;
  @Input() data!: CpsNotificationData;

  /**
   * Callback to invoke on toast close.
   * @param {any}
   * @group Emits
   */
  @Output() closed = new EventEmitter();

  timeout: any;
  maxWidth: string | undefined;
  filled = true;
  color = '';

  // eslint-disable-next-line no-useless-constructor
  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.maxWidth = convertSize(this.config?.maxWidth || '');
    this.filled = this.config?.appearance === CpsNotificationAppearance.FILLED;
    this.color =
      this.data?.type === CpsNotificationType.WARNING
        ? 'warn'
        : this.data?.type || CpsNotificationType.ERROR;
  }

  ngAfterViewInit(): void {
    this.initiateTimeout();
  }

  ngOnDestroy() {
    this.clearTimeout();
  }

  close() {
    this.clearTimeout();
    this.closed.emit();
  }

  initiateTimeout() {
    if (this.config?.timeout === 0) return;
    this.zone.runOutsideAngular(() => {
      this.timeout = setTimeout(() => {
        this.close();
      }, this.config?.timeout || 5000);
    });
  }

  clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}
