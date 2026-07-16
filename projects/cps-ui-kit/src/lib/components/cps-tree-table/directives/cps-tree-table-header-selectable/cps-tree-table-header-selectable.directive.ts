import {
  ComponentRef,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TTHeaderCheckbox } from '../../../../primeng-temp/treetable/public_api';

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
    this.elementRef.nativeElement.appendChild(
      this.checkboxCompRef.location.nativeElement
    );
  }

  ngOnDestroy(): void {
    this.checkboxCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
