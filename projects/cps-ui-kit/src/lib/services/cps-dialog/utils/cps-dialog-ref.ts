import { Observable, Subject, take } from 'rxjs';
import { CpsDialogComponent } from '../internal/components/cps-dialog/cps-dialog.component';

export class CpsDialogRef<T = any> {
  private _containerInstance!: CpsDialogComponent;

  _setContainerInstance(instance: CpsDialogComponent) {
    this._containerInstance = instance;
    this._handleContainerEvents();
  }

  private _handleContainerEvents() {
    this._containerInstance?._openStateChanged.pipe(take(1)).subscribe(() => {
      this._onOpen.next();
    });
    this._containerInstance?._dragStarted.subscribe((event: MouseEvent) => {
      this._onDragStart.next(event);
    });
    this._containerInstance?._dragEnded.subscribe((event: MouseEvent) => {
      this._onDragEnd.next(event);
    });
    this._containerInstance?._resizeStarted.subscribe((event: MouseEvent) => {
      this._onResizeStart.next(event);
    });
    this._containerInstance?._resizeEnded.subscribe((event: MouseEvent) => {
      this._onResizeEnd.next(event);
    });
    this._containerInstance?._maximizedStateChanged.subscribe(
      (value: boolean) => {
        this._onMaximize.next(value);
      }
    );
  }

  /**
   * The instance of the component opened into the dialog.
   * @group Props
   */
  componentInstance!: T;

  /**
   * Closes the dialog.
   * @group Method
   */
  close(result?: any) {
    if (this.disableClose) return;
    this._onClose.next(result);
  }

  /**
   * Destroys the dialog.
   * @group Method
   */
  destroy() {
    this._onDestroy.next();
  }

  /**
   * Sets dialog as full screen.
   * @group Method
   */
  maximize() {
    this._containerInstance?.toggleMaximized(true);
  }

  /**
   * Switches back from full screen dialog size to normal size.
   * @group Method
   */
  minimize() {
    this._containerInstance?.toggleMaximized(false);
  }

  /**
   * Checks whether the dialog is currently opened.
   * @group Method
   */
  isOpen() {
    return this._containerInstance?.visible || false;
  }

  /**
   * Checks whether the dialog is maximized.
   * @group Method
   */
  isMaximized() {
    return this._containerInstance?.maximized || false;
  }

  private readonly _onOpen = new Subject<void>();
  /**
   * Event triggered on dialog is opened.
   * @group Events
   */
  onOpen: Observable<void> = this._onOpen.asObservable();

  private readonly _onClose = new Subject<any>();
  /**
   * Event triggered on dialog is closed.
   * @param {any} result - Close result.
   * @group Events
   */
  onClose: Observable<any> = this._onClose.asObservable();

  private readonly _onDestroy = new Subject<void>();
  /**
   * Event triggered on dialog is destroyed.
   * @group Events
   */
  onDestroy: Observable<void> = this._onDestroy.asObservable();

  private readonly _onDragStart = new Subject<MouseEvent>();
  /**
   * Event triggered on drag start.
   * @param {MouseEvent} event - Mouse event.
   * @group Events
   */
  onDragStart: Observable<MouseEvent> = this._onDragStart.asObservable();

  private readonly _onDragEnd = new Subject<MouseEvent>();
  /**
   * Event triggered on drag end.
   * @param {MouseEvent} event - Mouse event.
   * @group Events
   */
  onDragEnd: Observable<MouseEvent> = this._onDragEnd.asObservable();

  private readonly _onResizeStart = new Subject<MouseEvent>();
  /**
   * Event triggered on resize start.
   * @param {MouseEvent} event - Mouse event.
   * @group Events
   */
  onResizeStart: Observable<MouseEvent> = this._onResizeStart.asObservable();

  private readonly _onResizeEnd = new Subject<MouseEvent>();
  /**
   * Event triggered on resize end.
   * @param {MouseEvent} event - Mouse event.
   * @group Events
   */
  onResizeEnd: Observable<MouseEvent> = this._onResizeEnd.asObservable();

  private readonly _onMaximize = new Subject<boolean>();
  /**
   * Event triggered on dialog maximized state changed.
   * @param {boolean} value - boolean value.
   * @group Events
   */
  onMaximize: Observable<boolean> = this._onMaximize.asObservable();

  /**
   * Specifies whether the user is allowed to close the dialog.
   * @group Props
   */
  disableClose?: boolean;
}
