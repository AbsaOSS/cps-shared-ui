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
import {
  prefersReducedMotion,
  REDUCED_MOTION_DURATION
} from '../../../../../utils/internal/motion-utils';

@Component({
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
      transition(
        'void => *',
        [
          style({ transform: 'translateY(100%)', opacity: 0 }),
          animate('{{showTiming}}')
        ],
        { params: { showTiming: '200ms ease-out' } }
      ),
      transition(
        '* => void',
        [
          animate(
            '{{hideTiming}}',
            style({
              height: 0,
              opacity: 0,
              transform: 'translateY(-100%)'
            })
          )
        ],
        { params: { hideTiming: '200ms ease-in' } }
      )
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
  srAnnouncement = '';

  get isPolite(): boolean {
    if (this.data?.type === CpsNotificationType.ERROR)
      return !!this.config?.politeError;
    if (this.data?.type === CpsNotificationType.WARNING)
      return !!this.config?.politeWarning;
    return true;
  }

  get closeAriaLabel(): string {
    const type = this.data?.type;
    return `Close ${type ? type + ' ' : ''}notification`;
  }

  get resolvedShowTiming(): string {
    return prefersReducedMotion() ? REDUCED_MOTION_DURATION : '200ms ease-out';
  }

  get resolvedHideTiming(): string {
    return prefersReducedMotion() ? REDUCED_MOTION_DURATION : '200ms ease-in';
  }

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
    setTimeout(() => {
      const type = this.data?.type;
      const details = this.data?.details;
      this.srAnnouncement = `${type ? type + ': ' : ''}${this.data?.message ?? ''}${details ? '. ' + details : ''}`;
    });
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
