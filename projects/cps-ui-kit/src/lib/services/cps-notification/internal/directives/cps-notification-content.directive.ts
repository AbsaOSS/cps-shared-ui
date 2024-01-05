import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cpsNotificationContent]'
})
export class CpsNotificationContentDirective {
  // eslint-disable-next-line no-useless-constructor
  constructor(public viewContainerRef: ViewContainerRef) {}
}
