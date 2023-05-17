import {
  Directive,
  Output,
  EventEmitter,
  ElementRef,
  HostListener
} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  // eslint-disable-next-line no-useless-constructor
  constructor (private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick (target: any) {
    if (!this.elementRef?.nativeElement?.classList?.contains('focused')) return;
    const clickedInside = this.elementRef?.nativeElement?.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
