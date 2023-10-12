import {
  Injectable,
  Injector,
  Type,
  EmbeddedViewRef,
  ComponentRef,
  Inject,
  ViewContainerRef
} from '@angular/core';
import {
  DynamicDialogComponent,
  DynamicDialogInjector,
  DynamicDialogConfig,
  DynamicDialogRef
} from 'primeng/dynamicdialog';

import { DOCUMENT } from '@angular/common';

@Injectable()
export class CpsDialogService {
  dialogComponentRefMap: Map<
    DynamicDialogRef,
    ComponentRef<DynamicDialogComponent>
  > = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
    @Inject(DOCUMENT) private document: Document
  ) {}

  public open(
    componentType: Type<any>,
    config: DynamicDialogConfig
  ): DynamicDialogRef {
    const dialogRef = this.appendDialogComponentToBody(config);

    const instance = this.dialogComponentRefMap.get(dialogRef)?.instance;
    if (instance) instance.childComponentType = componentType;

    return dialogRef;
  }

  private appendDialogComponentToBody(config: DynamicDialogConfig) {
    const map = new WeakMap();
    map.set(DynamicDialogConfig, config);

    const dialogRef = new DynamicDialogRef();
    map.set(DynamicDialogRef, dialogRef);

    const sub = dialogRef.onClose.subscribe(() => {
      this.dialogComponentRefMap.get(dialogRef)?.instance.close();
    });

    const destroySub = dialogRef.onDestroy.subscribe(() => {
      this.removeDialogComponentFromBody(dialogRef);
      destroySub.unsubscribe();
      sub.unsubscribe();
    });

    const componentRef = this.viewContainerRef.createComponent(
      DynamicDialogComponent,
      { injector: new DynamicDialogInjector(this.injector, map) }
    );

    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    this.document.body.appendChild(domElem);

    this.dialogComponentRefMap.set(dialogRef, componentRef);

    return dialogRef;
  }

  private removeDialogComponentFromBody(dialogRef: DynamicDialogRef) {
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
