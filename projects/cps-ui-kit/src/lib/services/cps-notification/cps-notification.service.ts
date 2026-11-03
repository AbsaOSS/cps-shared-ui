import {
  Injectable,
  EmbeddedViewRef,
  ComponentRef,
  Inject,
  ApplicationRef,
  createComponent,
  DestroyRef,
  inject,
  NgZone
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
import { CPS_FOCUS_SERVICE } from '../cps-focus/cps-focus.service';

/**
 * Service for showing notifications.
 *
 * Pressing Esc closes all open notifications, since they can cover the focused element (WCAG 2.4.11). Focus stays
 * where it is; if it was on a notification, it goes back to where it was before. An open menu or a dialog above the
 * notifications takes Esc first.
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsNotificationService {
  private _containersMap: Map<
    CpsNotificationPosition,
    ComponentRef<CpsNotificationContainerComponent>
  > = new Map();

  private readonly _zone = inject(NgZone);
  private readonly _focusService = inject(CPS_FOCUS_SERVICE);
  // Where focus was before it went into a notification, to go back to when Esc closes the notifications
  private _focusBeforeNotifications: HTMLElement | null = null;
  private _removeListeners: (() => void) | null = null;
  private _escapeThatShowed: Event | null = null;

  constructor(
    private _appRef: ApplicationRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    inject(DestroyRef).onDestroy(() => this._stopListening());
  }

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
    this._stopListening();
  }

  private _createNotification(
    type: CpsNotificationType,
    message: string,
    details?: string,
    config?: CpsNotificationConfig
  ) {
    config = this._initConfig(config);
    const data: CpsNotificationData = { type, message, details };

    // Shown while an Esc is still being handled (a panel it
    // closed reports back): that Esc must not close it
    const current = this.document.defaultView?.event;
    if (
      current?.type === 'keydown' &&
      (current as KeyboardEvent).key === 'Escape'
    )
      this._escapeThatShowed = current;

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
      containerComponentRef = this._createContainerComponent();
      containerComponentRef.setInput('position', position);

      this._appRef.attachView(containerComponentRef.hostView);

      const domElem = (containerComponentRef.hostView as EmbeddedViewRef<any>)
        .rootNodes[0] as HTMLElement;
      this.document.body.appendChild(domElem);

      containerComponentRef.instance.closed.subscribe(() => {
        this._tryRemoveContainer(position);
      });

      this._containersMap.set(position, containerComponentRef);
      this._listen();
    }

    containerComponentRef.instance.addNotification(config, data);
  }

  private _createContainerComponent(): ComponentRef<CpsNotificationContainerComponent> {
    return createComponent(CpsNotificationContainerComponent, {
      environmentInjector: this._appRef.injector
    });
  }

  private _tryRemoveContainer(position: CpsNotificationPosition) {
    const container = this._containersMap.get(position);

    if (!container?.instance || container.instance.notifications.length > 0)
      return;

    if (container) {
      this._appRef.detachView(container.hostView);
      container.destroy();
      this._containersMap.delete(position);
      if (this._containersMap.size === 0) this._stopListening();
    }
  }

  private _listen() {
    const win = this.document.defaultView;
    if (this._removeListeners || !win) return;

    const active = this.document.activeElement;
    this._focusBeforeNotifications =
      active instanceof HTMLElement && !this._isInNotifications(active)
        ? active
        : null;

    // On window, so it runs after the document listeners of menus and dialogs, which mark the Esc they handle
    const onKeydown = (event: KeyboardEvent) => this._onKeydown(event);
    const onFocusin = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        !this._isInNotifications(event.target)
      )
        this._focusBeforeNotifications = event.target;
    };
    this._zone.runOutsideAngular(() => {
      win.addEventListener('keydown', onKeydown);
      this.document.addEventListener('focusin', onFocusin, true);
    });
    this._removeListeners = () => {
      win.removeEventListener('keydown', onKeydown);
      this.document.removeEventListener('focusin', onFocusin, true);
    };
  }

  private _stopListening() {
    this._removeListeners?.();
    this._removeListeners = null;
    this._focusBeforeNotifications = null;
    this._escapeThatShowed = null;
  }

  private _onKeydown(event: KeyboardEvent) {
    if (
      event.key !== 'Escape' ||
      event.defaultPrevented ||
      event === this._escapeThatShowed
    )
      return;
    const onTop = Array.from(this._containersMap.values()).some((container) =>
      container.instance.isOnTop()
    );
    if (!onTop) return;

    event.preventDefault();
    const returnTo = this._focusBeforeNotifications;
    if (
      event.target instanceof Element &&
      this._isInNotifications(event.target) &&
      returnTo?.isConnected
    ) {
      if (this._focusService) this._focusService.focusElement(returnTo, true);
      else returnTo.focus();
    }
    this._zone.run(() => this.clear());
  }

  private _isInNotifications(el: Element): boolean {
    return Array.from(this._containersMap.values()).some((container) =>
      (
        (container.hostView as EmbeddedViewRef<unknown>)
          .rootNodes[0] as HTMLElement
      ).contains(el)
    );
  }
}
