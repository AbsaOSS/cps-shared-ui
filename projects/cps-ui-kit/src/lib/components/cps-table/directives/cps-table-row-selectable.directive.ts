import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TableCheckbox } from 'primeng/table';

/**
 * CpsTableRowSelectableDirective is a directive used to apply a checkbox to a body cell.
 * @group Directives
 */
@Directive({
  standalone: true,
  selector: '[cpsTRowSelectable]'
})
export class CpsTableRowSelectableDirective implements OnInit, OnDestroy {
  /**
   * Cell value.
   * @group Props
   */
  @Input('cpsTRowSelectable') value: any;
  checkboxCompRef: ComponentRef<TableCheckbox>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.checkboxCompRef = this.viewContainerRef.createComponent(TableCheckbox);
  }

  ngOnInit(): void {
    this.checkboxCompRef.setInput('value', this.value);

    this.elementRef.nativeElement.appendChild(
      this.checkboxCompRef.location.nativeElement
    );
  }

  ngOnDestroy(): void {
    this.checkboxCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
