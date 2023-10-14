import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[pDynamicDialogContent]',
  host: {
    class: 'p-element'
  }
})
export class CpsDialogContent {
  // eslint-disable-next-line no-useless-constructor
  constructor(public viewContainerRef: ViewContainerRef) {}
}
