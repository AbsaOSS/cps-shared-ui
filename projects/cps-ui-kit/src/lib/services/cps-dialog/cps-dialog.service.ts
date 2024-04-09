import {
  Injectable,
  Type,
  EmbeddedViewRef,
  ComponentRef,
  Inject,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  createEnvironmentInjector,
  Injector
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CpsDialogRef } from './utils/cps-dialog-ref';
import { CpsDialogConfig } from './utils/cps-dialog-config';
import { CpsDialogComponent } from './internal/components/cps-dialog/cps-dialog.component';
import { CpsConfirmationComponent } from './internal/components/cps-confirmation/cps-confirmation.component';

/**
 * Service for showing CpsDialog.
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class CpsDialogService {
  dialogComponentRefMap: Map<CpsDialogRef, ComponentRef<CpsDialogComponent>> =
    new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _appRef: ApplicationRef,
    private _environmentInjector: EnvironmentInjector,
    private _injector: Injector,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Opens a dialog with a dynamically loaded component.
   * @param {*} componentType - Dynamic component for content template.
   * @param {CpsDialogConfig} config - CpsDialogConfig object.
   * @returns {CpsDialogRef} CpsDialogRef instance.
   * @group Method
   */
  public open(componentType: Type<any>, config: CpsDialogConfig): CpsDialogRef {
    const dialogRef = this.appendDialogComponentToBody(config);

    const instance = this.dialogComponentRefMap.get(dialogRef)?.instance;
    if (instance) instance.childComponentType = componentType;

    return dialogRef;
  }

  /**
   * Opens a confirmation dialog.
   * @param {CpsDialogConfig} config - CpsDialogConfig object.
   * @returns {CpsDialogRef} CpsDialogRef instance.
   * @group Method
   */
  public openConfirmationDialog(config: CpsDialogConfig): CpsDialogRef {
    if (!config.headerTitle) config.headerTitle = 'Confirm the action';
    if (!config.headerIcon) config.headerIcon = 'warning';
    if (!config.headerIconColor) config.headerIconColor = 'calm';
    if (!config.minWidth) config.minWidth = '400px';
    if (!config.maxWidth) config.maxWidth = '600px';
    const dialogRef = this.appendDialogComponentToBody(config);

    const instance = this.dialogComponentRefMap.get(dialogRef)?.instance;
    if (instance) instance.childComponentType = CpsConfirmationComponent;

    return dialogRef;
  }

  /**
   * Closes all dialogs.
   * @param {boolean} [force=false] - If true closes all dialogs even if they have disableClose set to true.
   * @group Method
   */
  public closeAll(force = false): void {
    this.dialogComponentRefMap.forEach((_, key) => {
      if (force) {
        key.destroy();
      } else {
        key.close();
      }
    });
  }

  private appendDialogComponentToBody(config: CpsDialogConfig) {
    const dialogRef = new CpsDialogRef();

    const sub = dialogRef.onClose.subscribe(() => {
      this.dialogComponentRefMap.get(dialogRef)?.instance.close();
    });

    const destroySub = dialogRef.onDestroy.subscribe(() => {
      this.removeDialogComponentFromBody(dialogRef);
      destroySub.unsubscribe();
      sub.unsubscribe();
    });

    const componentRef = createComponent(CpsDialogComponent, {
      environmentInjector: createEnvironmentInjector(
        [
          { provide: CpsDialogConfig, useValue: config },
          { provide: CpsDialogRef, useValue: dialogRef }
        ],
        this._environmentInjector
      ),
      elementInjector:
        this._injector !== this._environmentInjector
          ? this._injector
          : undefined
    });

    this._appRef.attachView(componentRef.hostView);

    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    this.document.body.appendChild(domElem);

    this.dialogComponentRefMap.set(dialogRef, componentRef);
    dialogRef._setContainerInstance(componentRef.instance);

    return dialogRef;
  }

  private removeDialogComponentFromBody(dialogRef: CpsDialogRef) {
    if (!dialogRef || !this.dialogComponentRefMap.has(dialogRef)) {
      return;
    }

    const dialogComponentRef = this.dialogComponentRefMap.get(dialogRef);
    if (dialogComponentRef) {
      this._appRef.detachView(dialogComponentRef.hostView);
      dialogComponentRef.destroy();
      this.dialogComponentRefMap.delete(dialogRef);
    }
  }
}
