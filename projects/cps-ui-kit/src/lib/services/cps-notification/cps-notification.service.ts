import {
  Injectable,
  EmbeddedViewRef,
  ComponentRef,
  Inject,
  ApplicationRef,
  createComponent
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  CpsNotificationCategory,
  CpsNotificationConfig,
  CpsNotificationPosition,
  CpsNotificationType
} from './utils/cps-notification-config';
import { CpsNotificationContainerComponent } from './internal/components/cps-notification-container/cps-notification-container.component';
import { Observable, Subject } from 'rxjs';

/**
 * Service for showing notifications.
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsNotificationService {
  containersMap: Map<
    CpsNotificationPosition,
    ComponentRef<CpsNotificationContainerComponent>
  > = new Map();

  private notificationClosedSubject = new Subject<CpsNotificationConfig>();

  /**
   * An Observable that emits a new value whenever a notification is closed.
   */
  get notificationClosed(): Observable<CpsNotificationConfig> {
    return this.notificationClosedSubject.asObservable();
  }

  private _emitNotificationClosed(data: CpsNotificationConfig) {
    this.notificationClosedSubject.next(data);
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public info(
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    this._createNotification(
      CpsNotificationType.INFO,
      message,
      details,
      config
    );
  }

  public warning(
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    this._createNotification(
      CpsNotificationType.WARNING,
      message,
      details,
      config
    );
  }

  public success(
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    this._createNotification(
      CpsNotificationType.SUCCESS,
      message,
      details,
      config
    );
  }

  public error(
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    this._createNotification(
      CpsNotificationType.ERROR,
      message,
      details,
      config
    );
  }

  public clear() {
    this.containersMap.forEach((container) => {
      this._appRef.detachView(container.hostView);
      container.destroy();
    });
    this.containersMap.clear();
  }

  private _createNotification(
    type: CpsNotificationType,
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    config = this._initConfig(type, message, details, config);

    this.appendNotificationToContainer(config);
  }

  private _initConfig(
    type: CpsNotificationType,
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ): CpsNotificationConfig {
    if (!config) config = new CpsNotificationConfig();
    config.type = type;
    if (!config.message) config.message = message;
    if (!config.details) config.details = details;
    if (!config.category) config.category = CpsNotificationCategory.TOAST;
    if (!config.position) config.position = CpsNotificationPosition.TOPRIGHT;
    if (config.timeout === undefined) config.timeout = 5000;
    return config;
  }

  private appendNotificationToContainer(config: CpsNotificationConfig) {
    const position = config.position || CpsNotificationPosition.TOPRIGHT;

    let containerComponentRef = this.containersMap.get(position);

    if (!containerComponentRef) {
      containerComponentRef = createComponent(
        CpsNotificationContainerComponent,
        { environmentInjector: this._appRef.injector }
      );
      containerComponentRef.setInput('position', position);
      containerComponentRef.setInput('maxAmount', config.maxAmount);

      this._appRef.attachView(containerComponentRef.hostView);

      const domElem = (containerComponentRef.hostView as EmbeddedViewRef<any>)
        .rootNodes[0] as HTMLElement;
      this.document.body.appendChild(domElem);

      containerComponentRef.instance.closed.subscribe(
        (data: CpsNotificationConfig) => {
          this._emitNotificationClosed(data);
          this.tryRemoveContainer(position);
        }
      );

      this.containersMap.set(position, containerComponentRef);
    }

    containerComponentRef.instance.addNotification(config);
  }

  private tryRemoveContainer(position: CpsNotificationPosition) {
    const container = this.containersMap.get(position);

    if (!container?.instance || container.instance.notifications.length > 0)
      return;

    if (container) {
      this._appRef.detachView(container.hostView);
      container.destroy();
      this.containersMap.delete(position);
    }
  }
}
