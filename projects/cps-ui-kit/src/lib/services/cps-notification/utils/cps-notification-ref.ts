import { Observable, Subject, take } from 'rxjs';
import { CpsNotificationContainerComponent } from '../internal/components/cps-notification-container/cps-notification-container.component';

export class CpsNotificationRef<T = any> {
  private _containerInstance!: CpsNotificationContainerComponent;

  _setContainerInstance(instance: CpsNotificationContainerComponent) {
    this._containerInstance = instance;
    this._handleContainerEvents();
  }

  private _handleContainerEvents() {
    this._containerInstance?._openStateChanged.pipe(take(1)).subscribe(() => {
      this._onOpen.next();
    });
  }

  /**
   * The instance of the component opened into the notification.
   * @group Props
   */
  componentInstance!: T;

  /**
   * Closes the notification.
   * @group Method
   */
  close(result?: any) {
    if (this.disableClose) return;
    this._onClose.next(result);
  }

  /**
   * Destroys the notification.
   * @group Method
   */
  destroy() {
    this._onDestroy.next();
  }

  /**
   * Checks whether the notification is currently opened.
   * @group Method
   */
  isOpen() {
    return this._containerInstance?.visible || false;
  }

  private readonly _onOpen = new Subject<void>();
  /**
   * Event triggered on notification is opened.
   * @group Events
   */
  onOpen: Observable<void> = this._onOpen.asObservable();

  private readonly _onClose = new Subject<any>();
  /**
   * Event triggered on notification is closed.
   * @param {any} result - Close result.
   * @group Events
   */
  onClose: Observable<any> = this._onClose.asObservable();

  private readonly _onDestroy = new Subject<void>();
  /**
   * Event triggered on notification is destroyed.
   * @group Events
   */
  onDestroy: Observable<void> = this._onDestroy.asObservable();

  /**
   * Specifies whether the user is allowed to close the notification.
   * @group Props
   */
  disableClose?: boolean;
}
