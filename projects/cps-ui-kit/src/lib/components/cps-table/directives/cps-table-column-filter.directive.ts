import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  ViewContainerRef
} from '@angular/core';
import { TableColumnFilterComponent } from '../table-column-filter/table-column-filter.component';
import {
  CpsColumnFilterCategoryOption,
  CpsColumnFilterMatchMode,
  CpsColumnFilterType
} from '../cps-column-filter-types';

/**
 * CpsTableColumnFilterDirective is a filtering directive used to filter single or multiple columns in table.
 * @group Components
 */
@Directive({
  standalone: true,
  selector: '[cpsTColFilter]',
  exportAs: 'cpsTColFilter'
})
export class CpsTableColumnFilterDirective
  implements OnInit, OnChanges, OnDestroy
{
  /**
   * Name of the column to be filtered.
   * @group Props
   */
  @Input('cpsTColFilter') field: string | undefined;

  /**
   * Type of filter in table, it can be of type "number", "boolean", "text", "date" or "category".
   * @group Props
   */
  @Input() filterType: CpsColumnFilterType = 'text';

  /**
   * Whether the filter menu should be persistent.
   * @group Props
   */
  @Input() filterPersistent = false;

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
   * Whether the filter should have close button.
   * @group Props
   */
  @Input() filterShowCloseButton = false;

  /**
   * Whether the filter should have match modes.
   * @group Props
   */
  @Input() filterShowMatchModes = true;

  /**
   * Match modes for filter.
   * @group Props
   */
  @Input() filterMatchModes: CpsColumnFilterMatchMode[] = [];

  /**
   * Whether the filter should have operator.
   * @group Props
   */
  @Input() filterShowOperator = true;

  /**
   * Maximum number of constraints.
   * @group Props
   */
  @Input() filterMaxConstraints = 2;

  /**
   * Title of the filter.
   * @group Props
   */
  @Input() filterHeaderTitle = '';

  /**
   * Whether the filter should hide on clear.
   * @group Props
   */
  @Input() filterHideOnClear = false;

  /**
   * Options for category filter.
   * @group Props
   */
  @Input() filterCategoryOptions: CpsColumnFilterCategoryOption[] | string[] =
    [];

  /**
   * Show category filter as button toggles.
   * @group Props
   */
  @Input() filterAsButtonToggle = false;

  /**
   * Single selection for category filter.
   * @group Props
   */
  @Input() filterSingleSelection = false;

  /**
   * Placeholder for filter constraints.
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
    this.elementRef.nativeElement.firstChild.after(
      this.filterCompRef.location.nativeElement
    );
  }

  ngOnChanges(): void {
    this.filterCompRef.setInput('field', this.field);
    this.filterCompRef.setInput('type', this.filterType);
    this.filterCompRef.setInput('persistent', this.filterPersistent);
    this.filterCompRef.setInput('showClearButton', this.filterShowClearButton);
    this.filterCompRef.setInput('showApplyButton', this.filterShowApplyButton);
    this.filterCompRef.setInput('showCloseButton', this.filterShowCloseButton);
    this.filterCompRef.setInput('showMatchModes', this.filterShowMatchModes);
    this.filterCompRef.setInput('matchModes', this.filterMatchModes);
    this.filterCompRef.setInput('showOperator', this.filterShowOperator);
    this.filterCompRef.setInput('maxConstraints', this.filterMaxConstraints);
    this.filterCompRef.setInput('headerTitle', this.filterHeaderTitle);
    this.filterCompRef.setInput('hideOnClear', this.filterHideOnClear);
    this.filterCompRef.setInput('categoryOptions', this.filterCategoryOptions);
    this.filterCompRef.setInput('asButtonToggle', this.filterAsButtonToggle);
    this.filterCompRef.setInput('singleSelection', this.filterSingleSelection);
    this.filterCompRef.setInput(
      'placeholder',
      this.filterPlaceholder || this._getDefaultPlaceholder()
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

  hideFilter() {
    this.filterCompRef?.instance?.hide();
  }

  clearFilter() {
    this.filterCompRef?.instance?.clearFilter();
  }

  clearFilterValues() {
    this.filterCompRef?.instance?.clearFilterValues();
  }

  ngOnDestroy(): void {
    this.filterCompRef.destroy();
    this.viewContainerRef.clear();
  }
}
