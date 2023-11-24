import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cpsDialogContent]'
})
export class CpsDialogContentDirective {
  // eslint-disable-next-line no-useless-constructor
  constructor(public viewContainerRef: ViewContainerRef) {}
}
