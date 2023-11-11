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

@Directive({
  standalone: true,
  selector: '[cpsTColFilter]',
  exportAs: 'cpsTColFilter'
})
export class CpsTableColumnFilterDirective
  implements OnInit, OnChanges, OnDestroy
{
  @Input('cpsTColFilter') field: string | undefined;
  @Input() filterType: CpsColumnFilterType = 'text';
  @Input() filterPersistent = false;
  @Input() filterShowClearButton = true;
  @Input() filterShowApplyButton = true;
  @Input() filterShowCloseButton = false;
  @Input() filterShowMatchModes = true;
  @Input() filterMatchModes: CpsColumnFilterMatchMode[] = [];
  @Input() filterShowOperator = true;
  @Input() filterMaxConstraints = 2;
  @Input() filterHeaderTitle = '';
  @Input() filterHideOnClear = false;
  @Input() filterCategoryOptions: CpsColumnFilterCategoryOption[] | string[] =
    [];

  @Input() filterAsButtonToggle = false; // for category filterType only
  @Input() filterSingleSelection = false; // for category filterType only
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
