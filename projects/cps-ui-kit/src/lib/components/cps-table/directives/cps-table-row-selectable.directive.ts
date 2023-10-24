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
 * CpsTableRowSelectableDirective is a selecting directive used to choose single or multiple rows in table.
 * @group Components
 */
@Directive({
  standalone: true,
  selector: '[cpsTRowSelectable]'
})
export class CpsTableRowSelectableDirective implements OnInit, OnDestroy {
  /**
   * Value in row selected.
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
