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
import { Subject } from 'rxjs';

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

  containersMap: Map<
    CpsNotificationPosition,
    ComponentRef<CpsNotificationContainerComponent>
  > = new Map();

  private notificationClosedSubject = new Subject<CpsNotificationConfig>();

  notificationClosed$ = this.notificationClosedSubject.asObservable();

  // Method to emit the event
  emitNotificationClosed(data: CpsNotificationConfig) {
    this.notificationClosedSubject.next(data);
  }

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

  public clear() {
    // TODO remove all notifications
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
      this.removeContainer(notificationRef);
      destroySub.unsubscribe();
      sub.unsubscribe();
    });

    // CREATE CONTAINER COMPONENT IF IT DOESN'T EXIST ON SELECTED POSITION
    const position = config.position || CpsNotificationPosition.TOPRIGHT;
    let containerComponentRef = this.containersMap.get(position);
    if (!containerComponentRef) {
      containerComponentRef = this.viewContainerRef.createComponent(
        CpsNotificationContainerComponent,
        { injector: new DynamicDialogInjector(this.injector, map) }
      );
      const domElem = (containerComponentRef.hostView as EmbeddedViewRef<any>)
        .rootNodes[0] as HTMLElement;
      this.document.body.appendChild(domElem);

      this.notificationsRefMap.set(notificationRef, containerComponentRef);
      notificationRef._setContainerInstance(containerComponentRef.instance);

      this.containersMap.set(position, containerComponentRef);
    }

    containerComponentRef.instance.addNotification(config);

    return notificationRef;
  }

  private removeContainer(notificationRef: CpsNotificationRef) {
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
