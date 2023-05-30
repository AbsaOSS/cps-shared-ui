import {
  Directive,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  Input
} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {
  @Input() skipTargets: string[] = [];
  @Output() clickOutside = new EventEmitter<void>();

  // eslint-disable-next-line no-useless-constructor
  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(target: any) {
    if (!this.elementRef?.nativeElement?.classList?.contains('focused')) return;

    for (const clss of this.skipTargets) {
      if (target?.classList?.contains(clss)) {
        this.clickOutside.emit();
        return;
      }
    }

    // if an element was detached from the dom, we are not clicking outside
    if (!target?.isConnected) {
      return;
    }
    const clickedInside = this.elementRef?.nativeElement?.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
