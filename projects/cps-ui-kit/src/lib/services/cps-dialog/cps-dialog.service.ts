import {
  Injectable,
  Injector,
  Type,
  EmbeddedViewRef,
  ComponentRef,
  Inject,
  ViewContainerRef
} from '@angular/core';
import { DynamicDialogInjector } from 'primeng/dynamicdialog';
import { DOCUMENT } from '@angular/common';
import { CpsDialogRef } from './utils/cps-dialog-ref';
import { CpsDialogConfig } from './utils/cps-dialog-config';
import { CpsDialogComponent } from './internal/components/cps-dialog/cps-dialog.component';
import { CpsConfirmationComponent } from './internal/components/cps-confirmation/cps-confirmation.component';

/**
 * Service for showing CpsDialog.
 * @group Services
 */
@Injectable()
export class CpsDialogService {
  dialogComponentRefMap: Map<CpsDialogRef, ComponentRef<CpsDialogComponent>> =
    new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
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

  private appendDialogComponentToBody(config: CpsDialogConfig) {
    const map = new WeakMap();
    map.set(CpsDialogConfig, config);

    const dialogRef = new CpsDialogRef();
    map.set(CpsDialogRef, dialogRef);

    const sub = dialogRef.onClose.subscribe(() => {
      this.dialogComponentRefMap.get(dialogRef)?.instance.close();
    });

    const destroySub = dialogRef.onDestroy.subscribe(() => {
      this.removeDialogComponentFromBody(dialogRef);
      destroySub.unsubscribe();
      sub.unsubscribe();
    });

    const componentRef = this.viewContainerRef.createComponent(
      CpsDialogComponent,
      { injector: new DynamicDialogInjector(this.injector, map) }
    );

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
      this.viewContainerRef.detach(
        this.viewContainerRef.indexOf(dialogComponentRef.hostView)
      );
      dialogComponentRef.destroy();
      this.dialogComponentRefMap.delete(dialogRef);
    }
  }
}
