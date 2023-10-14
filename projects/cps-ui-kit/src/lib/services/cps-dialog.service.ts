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
import { CpsConfirmationComponent } from '../components/internal/cps-confirmation/cps-confirmation.component';
import { CpsDialogConfig } from '../components/cps-dialog/cps-dialog-config';
import { CpsDialogRef } from '../components/cps-dialog/cps-dialog-ref';
import { CpsDialogComponent } from '../components/internal/cps-dialog/cps-dialog.component';

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

  public open(componentType: Type<any>, config: CpsDialogConfig): CpsDialogRef {
    const dialogRef = this.appendDialogComponentToBody(config);

    const instance = this.dialogComponentRefMap.get(dialogRef)?.instance;
    if (instance) instance.childComponentType = componentType;

    return dialogRef;
  }

  public openConfirmationDialog(config: CpsDialogConfig): CpsDialogRef {
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
