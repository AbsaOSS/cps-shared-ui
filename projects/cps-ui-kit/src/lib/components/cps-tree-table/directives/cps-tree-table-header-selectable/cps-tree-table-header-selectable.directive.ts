import {
  ComponentRef,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TTHeaderCheckbox } from 'primeng/treetable';

/**
 * CpsTreeTableHeaderSelectableDirective is a directive used to apply a checkbox to a header cell.
 * @group Directives
 */
@Directive({
  selector: '[cpsTTHdrSelectable]'
})
export class CpsTreeTableHeaderSelectableDirective
  implements OnInit, OnDestroy
{
  checkboxCompRef: ComponentRef<TTHeaderCheckbox>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.checkboxCompRef =
      this.viewContainerRef.createComponent(TTHeaderCheckbox);
  }

  ngOnInit(): void {
    this.elementRef.nativeElement.classList.add(
      'cps-treetable-selectable-cell'
    );
    this.checkboxCompRef.setInput('pt', {
      pcHeaderCheckbox: { input: { 'aria-label': 'Select all rows' } }
    });
    const checkboxEl = this.checkboxCompRef.location.nativeElement;
    checkboxEl.setAttribute(
      'data-testid',
      'cps-treetable-header-selectable-checkbox'
    );
    this.elementRef.nativeElement.appendChild(checkboxEl);
  }

  ngOnDestroy(): void {
    this.checkboxCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
