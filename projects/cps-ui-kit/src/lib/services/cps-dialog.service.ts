import {
  Injectable,
  ComponentFactoryResolver,
  ApplicationRef,
  Injector,
  Type,
  EmbeddedViewRef,
  ComponentRef,
  Inject
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
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
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

    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        DynamicDialogComponent
      );
    const componentRef = componentFactory.create(
      new DynamicDialogInjector(this.injector, map)
    );

    this.appRef.attachView(componentRef.hostView);

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
      this.appRef.detachView(dialogComponentRef.hostView);
      dialogComponentRef.destroy();
      this.dialogComponentRefMap.delete(dialogRef);
    }
  }
}
