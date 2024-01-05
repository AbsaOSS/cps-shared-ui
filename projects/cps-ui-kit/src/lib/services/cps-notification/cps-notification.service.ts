import {
  Injectable,
  Injector,
  EmbeddedViewRef,
  ComponentRef,
  Inject,
  ViewContainerRef
} from '@angular/core';
import { DynamicDialogInjector } from 'primeng/dynamicdialog';
import { DOCUMENT } from '@angular/common';
import { CpsNotificationRef } from './utils/cps-notification-ref';
import {
  CpsNotificationCategory,
  CpsNotificationConfig,
  CpsNotificationPosition,
  CpsNotificationType
} from './utils/cps-notification-config';
import { CpsNotificationContainerComponent } from './internal/components/cps-notification-container/cps-notification-container.component';
import { CpsToastComponent } from './internal/components/cps-toast/cps-toast.component';

/**
 * Service for showing notifications.
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsNotificationService {
  notificationsRefMap: Map<
    CpsNotificationRef,
    ComponentRef<CpsNotificationContainerComponent>
  > = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public info(
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ): CpsNotificationRef {
    return this._createNotification(
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
  ): CpsNotificationRef {
    return this._createNotification(
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
  ): CpsNotificationRef {
    return this._createNotification(
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
  ): CpsNotificationRef {
    return this._createNotification(
      CpsNotificationType.ERROR,
      message,
      details,
      config
    );
  }

  private _createNotification(
    type: CpsNotificationType,
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ): CpsNotificationRef {
    config = this._initConfig(type, config);

    const notificationRef = this.appendNotificationToContainer(config);

    const instance = this.notificationsRefMap.get(notificationRef)?.instance;
    if (instance) instance.childComponentType = CpsToastComponent;

    return notificationRef;
  }

  private _initConfig(
    type: CpsNotificationType,
    config?: CpsNotificationConfig
  ): CpsNotificationConfig {
    if (!config) config = new CpsNotificationConfig();
    config.type = type;
    if (!config.category) config.category = CpsNotificationCategory.TOAST;
    if (!config.position) config.position = CpsNotificationPosition.TOPRIGHT;
    if (!config.timeout) config.timeout = 5000;
    return config;
  }

  // public open(
  //   componentType: Type<any>,
  //   config: CpsNotificationConfig
  // ): CpsNotificationRef {
  //   const dialogRef = this.appendNotificationToContainer(config);

  //   const instance = this.notificationsRefMap.get(dialogRef)?.instance;
  //   if (instance) instance.childComponentType = componentType;

  //   return dialogRef;
  // }

  private appendNotificationToContainer(config: CpsNotificationConfig) {
    const map = new WeakMap();
    map.set(CpsNotificationConfig, config);

    const notificationRef = new CpsNotificationRef();
    map.set(CpsNotificationRef, notificationRef);

    const sub = notificationRef.onClose.subscribe(() => {
      this.notificationsRefMap.get(notificationRef)?.instance.close();
    });

    const destroySub = notificationRef.onDestroy.subscribe(() => {
      this.removeNotificationFromContainer(notificationRef);
      destroySub.unsubscribe();
      sub.unsubscribe();
    });

    const componentRef = this.viewContainerRef.createComponent(
      CpsNotificationContainerComponent,
      { injector: new DynamicDialogInjector(this.injector, map) }
    );

    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    this.document.body.appendChild(domElem);

    this.notificationsRefMap.set(notificationRef, componentRef);
    notificationRef._setContainerInstance(componentRef.instance);

    return notificationRef;
  }

  private removeNotificationFromContainer(notificationRef: CpsNotificationRef) {
    if (!notificationRef || !this.notificationsRefMap.has(notificationRef)) {
      return;
    }

    const dialogComponentRef = this.notificationsRefMap.get(notificationRef);
    if (dialogComponentRef) {
      this.viewContainerRef.detach(
        this.viewContainerRef.indexOf(dialogComponentRef.hostView)
      );
      dialogComponentRef.destroy();
      this.notificationsRefMap.delete(notificationRef);
    }
  }
}
