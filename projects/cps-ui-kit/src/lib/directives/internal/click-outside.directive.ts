import {
  Directive,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  Input
} from '@angular/core';

/**
 * ClickOutsideDirective is an internal directive when clicking outside a component.
 * @group Directives
 */
@Directive({
  standalone: true,
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {
  /**
   * Classes list to skip outside click.
   * @group Props
   */
  @Input() skipTargets: string[] = [];

  /**
   * Callback to invoke on outside click.
   * @param {void} void - outside click.
   * @group Emits
   */
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
