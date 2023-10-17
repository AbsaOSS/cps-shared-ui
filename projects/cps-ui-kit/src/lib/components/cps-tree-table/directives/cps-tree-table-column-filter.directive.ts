import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TableColumnFilterComponent } from '../../cps-table/table-column-filter/table-column-filter.component';

export type CpsTreeTableColumnFilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'category';

@Directive({
  standalone: true,
  selector: '[cpsTTColFilter]'
})
export class CpsTreeTableColumnFilterDirective implements OnInit, OnDestroy {
  @Input('cpsTTColFilter') field: string | undefined;
  /**
   * Type of filter in tree table.
   * @group Props
   */
  @Input() filterType: CpsTreeTableColumnFilterType = 'text';
  /**
   * Whether the filter should have clear button.
   * @group Props
   */
  @Input() filterShowClearButton = true;
  /**
   * Whether the filter should have apply button.
   * @group Props
   */
  @Input() filterShowApplyButton = true;
  /**
   * Whether the filter should hide on clear.
   * @group Props
   */
  @Input() filterHideOnClear = false;
  @Input() filterCategoryOptions: string[] = [];
  /**
   * Hint text for the filter input field.
   * @group Props
   */
  @Input() filterPlaceholder = '';

  filterCompRef: ComponentRef<TableColumnFilterComponent>;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    this.filterCompRef = this.viewContainerRef.createComponent(
      TableColumnFilterComponent
    );
  }

  ngOnInit(): void {
    this.filterCompRef.setInput('field', this.field);
    this.filterCompRef.setInput('type', this.filterType);
    this.filterCompRef.setInput('showClearButton', this.filterShowClearButton);
    this.filterCompRef.setInput('showApplyButton', this.filterShowApplyButton);
    this.filterCompRef.setInput('hideOnClear', this.filterHideOnClear);
    this.filterCompRef.setInput('maxConstraints', 1);
    this.filterCompRef.setInput('categoryOptions', this.filterCategoryOptions);
    this.filterCompRef.setInput(
      'placeholder',
      this.filterPlaceholder || this._getDefaultPlaceholder()
    );

    this.elementRef.nativeElement.firstChild.after(
      this.filterCompRef.location.nativeElement
    );
  }

  private _getDefaultPlaceholder() {
    switch (this.filterType) {
      case 'text':
        return 'Please enter';
      case 'number':
        return 'Enter value';
      case 'date':
        return 'Select date';
      case 'category':
        return 'Please select';
      default:
        return '';
    }
  }

  ngOnDestroy(): void {
    this.filterCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
