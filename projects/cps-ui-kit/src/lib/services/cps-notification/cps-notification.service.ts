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
  CpsNotificationAppearance,
  CpsNotificationConfig,
  CpsNotificationPosition
} from './utils/cps-notification-config';
import {
  CpsNotificationData,
  CpsNotificationType
} from './utils/internal/cps-notification-data';
import { CpsNotificationContainerComponent } from './internal/components/cps-notification-container/cps-notification-container.component';

/**
 * Service for showing notifications.
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsNotificationService {
  private _containersMap: Map<
    CpsNotificationPosition,
    ComponentRef<CpsNotificationContainerComponent>
  > = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Shows a notification with type 'info'.
   * @param {string} message - Notification message.
   * @param {string} details - Notification details.
   * @param {CpsNotificationConfig} config - CpsNotificationConfig object.
   * @group Method
   */
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

  /**
   * Shows a notification with type 'warning'.
   * @param {string} message - Notification message.
   * @param {string} details - Notification details.
   * @param {CpsNotificationConfig} config - CpsNotificationConfig object.
   * @group Method
   */
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

  /**
   * Shows a notification with type 'success'.
   * @param {string} message - Notification message.
   * @param {string} details - Notification details.
   * @param {CpsNotificationConfig} config - CpsNotificationConfig object.
   * @group Method
   */
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

  /**
   * Shows a notification with type 'error'.
   * @param {string} message - Notification message.
   * @param {string} details - Notification details.
   * @param {CpsNotificationConfig} config - CpsNotificationConfig object.
   * @group Method
   */
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

  /**
   * Clears all notifications.
   * @group Method
   */
  public clear() {
    this._containersMap.forEach((container) => {
      this._appRef.detachView(container.hostView);
      container.destroy();
    });
    this._containersMap.clear();
  }

  private _createNotification(
    type: CpsNotificationType,
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    config = this._initConfig(config);
    const data: CpsNotificationData = { type, message, details };

    this._appendNotificationToContainer(data, config);
  }

  private _initConfig(config?: CpsNotificationConfig): CpsNotificationConfig {
    if (!config) config = {};
    if (!config.appearance)
      config.appearance = CpsNotificationAppearance.FILLED;
    if (!config.position) config.position = CpsNotificationPosition.TOPRIGHT;
    if (config.timeout === undefined || config.timeout === null)
      config.timeout = 5000;
    return config;
  }

  private _appendNotificationToContainer(
    data: CpsNotificationData,
    config: CpsNotificationConfig
  ) {
    const position = config.position || CpsNotificationPosition.TOPRIGHT;

    let containerComponentRef = this._containersMap.get(position);
    if (!containerComponentRef) {
      containerComponentRef = createComponent(
        CpsNotificationContainerComponent,
        { environmentInjector: this._appRef.injector }
      );
      containerComponentRef.setInput('position', position);

      this._appRef.attachView(containerComponentRef.hostView);

      const domElem = (containerComponentRef.hostView as EmbeddedViewRef<any>)
        .rootNodes[0] as HTMLElement;
      this.document.body.appendChild(domElem);

      containerComponentRef.instance.closed.subscribe(() => {
        this._tryRemoveContainer(position);
      });

      this._containersMap.set(position, containerComponentRef);
    }

    containerComponentRef.instance.addNotification(config, data);
  }

  private _tryRemoveContainer(position: CpsNotificationPosition) {
    const container = this._containersMap.get(position);

    if (!container?.instance || container.instance.notifications.length > 0)
      return;

    if (container) {
      this._appRef.detachView(container.hostView);
      container.destroy();
      this._containersMap.delete(position);
    }
  }
}
