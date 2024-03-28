import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterMetadata, FilterOperator, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { TreeTable } from 'primeng/treetable';
import {
  CpsColumnFilterCategoryOption,
  CpsColumnFilterMatchMode,
  CpsColumnFilterType
} from '../../../cps-column-filter-types';
import { CpsButtonComponent } from '../../../../cps-button/cps-button.component';
import { CpsMenuComponent } from '../../../../cps-menu/cps-menu.component';
import { CpsIconComponent } from '../../../../cps-icon/cps-icon.component';
import { CpsSelectComponent } from '../../../../cps-select/cps-select.component';
import { TableColumnFilterConstraintComponent } from '../table-column-filter-constraint/table-column-filter-constraint.component';
import { Subscription } from 'rxjs';

/**
 * TableColumnFilterComponent is an internal filter component in table and treetable.
 */
@Component({
  selector: 'table-column-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsButtonComponent,
    CpsMenuComponent,
    CpsIconComponent,
    CpsSelectComponent,
    TableColumnFilterConstraintComponent
  ],
  templateUrl: './table-column-filter.component.html',
  styleUrls: ['./table-column-filter.component.scss']
})
export class TableColumnFilterComponent implements OnInit, OnDestroy {
  /**
   * Name of the column to be filtered.
   * @group Props
   */
  @Input() field: string | undefined;

  /**
   * Type of filter in table, it can be of type "number", "boolean", "text", "date" or "category".
   * @group Props
   */
  @Input() type: CpsColumnFilterType = 'text';

  /**
   * Determines whether the filter menu should be persistent.
   * @group Props
   */
  @Input() persistent = false;

  /**
   * Determines whether the filter should have clear button.
   * @group Props
   */
  @Input() showClearButton = true;

  /**
   * Determines whether the filter should have apply button.
   * @group Props
   */
  @Input() showApplyButton = true;

  /**
   * Determines whether the filter should have close button.
   * @group Props
   */
  @Input() showCloseButton = false;

  /**
   * Determines whether the filter should have match modes.
   * @group Props
   */
  @Input() showMatchModes = true;

  /**
   * Match modes for filter.
   * @group Props
   */
  @Input() matchModes: CpsColumnFilterMatchMode[] = [];

  /**
   * Determines whether the filter should have operator.
   * @group Props
   */
  @Input() showOperator = true;

  /**
   * Maximum number of constraints.
   * @group Props
   */
  @Input() maxConstraints = 2;

  /**
   * Title of the filter.
   * @group Props
   */
  @Input() headerTitle = '';

  /**
   * Determines whether the filter should hide on clear.
   * @group Props
   */
  @Input() hideOnClear = false;

  /**
   * Options for category filter.
   * @group Props
   */
  @Input() categoryOptions: CpsColumnFilterCategoryOption[] | string[] = [];

  /**
   * Determines whether to show category filter as button toggles.
   * @group Props
   */
  @Input() asButtonToggle = false;

  /**
   * Single selection for category filter.
   * @group Props
   */
  @Input() singleSelection = false;

  /**
   * Placeholder for filter constraints.
   * @group Props
   */
  @Input() placeholder = '';

  @ViewChildren('constraintComponent')
  constraintCompList!: QueryList<TableColumnFilterConstraintComponent>;

  operator: string = FilterOperator.AND;

  operatorOptions = [
    { label: 'Match All', value: FilterOperator.AND, info: 'AND' },
    { label: 'Match Any', value: FilterOperator.OR, info: 'OR' }
  ];

  private matchModeLabels = {
    startsWith: 'Starts with',
    contains: 'Contains',
    notContains: 'Does not contain',
    endsWith: 'Ends with',
    equals: 'Equals',
    notEquals: 'Does not equal',
    lt: 'Less than',
    lte: 'Less than or equal to',
    gt: 'Greater than',
    gte: 'Greater than or equal to',
    dateIs: 'Date is',
    dateIsNot: 'Date is not',
    dateBefore: 'Date is before',
    dateAfter: 'Date is after'
  } as { [key: string]: string };

  private filterMatchModeOptions = {
    text: [
      CpsColumnFilterMatchMode.STARTS_WITH,
      CpsColumnFilterMatchMode.CONTAINS,
      CpsColumnFilterMatchMode.NOT_CONTAINS,
      CpsColumnFilterMatchMode.ENDS_WITH,
      CpsColumnFilterMatchMode.EQUALS,
      CpsColumnFilterMatchMode.NOT_EQUALS
    ],
    number: [
      CpsColumnFilterMatchMode.EQUALS,
      CpsColumnFilterMatchMode.NOT_EQUALS,
      CpsColumnFilterMatchMode.LESS_THAN,
      CpsColumnFilterMatchMode.LESS_THAN_OR_EQUAL_TO,
      CpsColumnFilterMatchMode.GREATER_THAN,
      CpsColumnFilterMatchMode.GREATER_THAN_OR_EQUAL_TO
    ],
    date: [
      CpsColumnFilterMatchMode.DATE_IS,
      CpsColumnFilterMatchMode.DATE_IS_NOT,
      CpsColumnFilterMatchMode.DATE_BEFORE,
      CpsColumnFilterMatchMode.DATE_AFTER
    ]
  } as { [key: string]: CpsColumnFilterMatchMode[] };

  currentMatchModes: SelectItem[] | undefined;

  @ViewChild('columnFilterMenu')
  columnFilterMenu!: CpsMenuComponent;

  private _tableInstance: Table | TreeTable;
  private _onFilterSub?: Subscription;

  isFilterApplied = false;

  get isCategoryDropdownOpened() {
    if (this.type !== 'category') return false;
    return this.constraintCompList?.first?.isCategoryDropdownOpened || false;
  }

  constructor(
    public elementRef: ElementRef,
    @Optional() public dt: Table,
    @Optional() public tt: TreeTable
  ) {
    this._tableInstance = dt || tt;
  }

  ngOnInit() {
    if (this.matchModes.length > 0) {
      this.filterMatchModeOptions[this.type] = this.matchModes;
    }

    this._onFilterSub = this._tableInstance?.onFilter?.subscribe((value) =>
      this._updateFilterApplied(value)
    );

    if (!this._tableInstance.filters[<string>this.field]) {
      this._initFieldFilterConstraint();
    }

    if (this.maxConstraints > 1 && this.type !== 'category') {
      this.showApplyButton = true;
    }

    if (this.type === 'boolean') {
      this.showApplyButton = false;
    }

    this.currentMatchModes = this.filterMatchModeOptions[this.type]?.map(
      (key: string) => {
        return { label: this.matchModeLabels[key], value: key };
      }
    );
  }

  ngOnDestroy(): void {
    this._onFilterSub?.unsubscribe();
  }

  private _updateFilterApplied(value: any) {
    const fieldFilter = value.filters[<string>this.field];
    if (fieldFilter) {
      if (Array.isArray(fieldFilter)) {
        this.isFilterApplied = (<FilterMetadata[]>fieldFilter).some(
          (meta) => !this._tableInstance.isFilterBlank(meta.value)
        );
      } else {
        this.isFilterApplied = !this._tableInstance.isFilterBlank(
          fieldFilter.value
        );
      }
    } else {
      this.isFilterApplied = false;
    }
  }

  private _initFieldFilterConstraint() {
    const defaultMatchMode = this._getDefaultMatchMode();
    if (this._tableInstance instanceof Table) {
      this._tableInstance.filters[<string>this.field] = [
        {
          value: null,
          matchMode: defaultMatchMode,
          operator: this.operator
        }
      ];
    } else {
      this._tableInstance.filters[<string>this.field] = {
        value: null,
        matchMode: defaultMatchMode
      };
    }
  }

  private _getDefaultMatchMode(): string {
    const getMatchMode = (val: CpsColumnFilterMatchMode) => {
      if (this.type in this.filterMatchModeOptions) {
        return this.filterMatchModeOptions[this.type].includes(val)
          ? val
          : this.filterMatchModeOptions[this.type][0];
      } else {
        return val;
      }
    };

    switch (this.type) {
      case 'text':
        return getMatchMode(CpsColumnFilterMatchMode.STARTS_WITH);
      case 'number':
        return getMatchMode(CpsColumnFilterMatchMode.EQUALS);
      case 'date':
        return getMatchMode(CpsColumnFilterMatchMode.DATE_IS);
      case 'category':
        return this.singleSelection
          ? CpsColumnFilterMatchMode.IS
          : CpsColumnFilterMatchMode.IN;
      default:
        return getMatchMode(CpsColumnFilterMatchMode.CONTAINS);
    }
  }

  private _getDefaultOperator(): string | undefined {
    return this._tableInstance.filters
      ? (<FilterMetadata[]>(
          this._tableInstance.filters[<string>(<string>this.field)]
        ))[0].operator
      : this.operator;
  }

  private _updateSortIconColor(color: string) {
    const unsortedUp =
      this.elementRef?.nativeElement?.parentElement?.querySelector(
        '.sort-unsorted-arrow-up'
      );
    if (unsortedUp) {
      unsortedUp.style.borderBottomColor = color;
    }
    const unsortedDown =
      this.elementRef?.nativeElement?.parentElement?.querySelector(
        '.sort-unsorted-arrow-down'
      );
    if (unsortedDown) {
      unsortedDown.style.borderTopColor = color;
    }
  }

  onCloseClick() {
    this.hide();
  }

  onMenuMatchModeChange(value: any, filterMeta: FilterMetadata) {
    filterMeta.matchMode = value;

    if (!this.showApplyButton) {
      this._tableInstance._filter();
    }
  }

  addConstraint() {
    (<FilterMetadata[]>this._tableInstance.filters[<string>this.field]).push({
      value: null,
      matchMode: this._getDefaultMatchMode(),
      operator: this._getDefaultOperator()
    });
  }

  removeConstraint(filterMeta: FilterMetadata) {
    this._tableInstance.filters[<string>this.field] = (<FilterMetadata[]>(
      this._tableInstance.filters[<string>this.field]
    )).filter((meta) => meta !== filterMeta);
    this._tableInstance._filter();
  }

  onOperatorChange(value: any) {
    (<FilterMetadata[]>this._tableInstance.filters[<string>this.field]).forEach(
      (filterMeta) => {
        filterMeta.operator = value;
        this.operator = value;
      }
    );

    if (!this.showApplyButton) {
      this._tableInstance._filter();
    }
  }

  get fieldConstraints(): FilterMetadata[] | undefined | null {
    if (this._tableInstance instanceof Table) {
      return this._tableInstance.filters
        ? <FilterMetadata[]>this._tableInstance.filters[<string>this.field]
        : null;
    } else {
      return this._tableInstance.filters
        ? <FilterMetadata[]>[this._tableInstance.filters[<string>this.field]]
        : null;
    }
  }

  get showRemoveIcon(): boolean {
    return this.fieldConstraints ? this.fieldConstraints.length > 1 : false;
  }

  get isShowOperator(): boolean {
    return (
      this.showOperator &&
      this.maxConstraints > 1 &&
      !['boolean', 'category'].includes(this.type)
    );
  }

  get isShowAddConstraint(): boolean | undefined | null {
    return (
      !['boolean', 'category'].includes(this.type) &&
      this.fieldConstraints &&
      this.fieldConstraints.length < this.maxConstraints
    );
  }

  hide() {
    this.columnFilterMenu.hide();
  }

  clearFilter() {
    this._initFieldFilterConstraint();
    this._tableInstance._filter();
    if (this.hideOnClear) this.hide();
  }

  clearFilterValues() {
    this._initFieldFilterConstraint();
    this.isFilterApplied = false;
  }

  applyFilter() {
    this._tableInstance._filter();
    this.hide();
  }

  onMenuShown() {
    const parent = this.elementRef?.nativeElement?.parentElement;
    const className = 'cps-table-col-filter-menu-open';
    parent.classList.add(className);
  }

  onBeforeMenuHidden() {
    if (!this.isFilterApplied) this._initFieldFilterConstraint();
  }

  onMenuHidden() {
    const parent = this.elementRef?.nativeElement?.parentElement;
    const className = 'cps-table-col-filter-menu-open';
    parent.classList.remove(className);
  }

  @HostListener('click', ['$event'])
  onClick(event: any) {
    event.stopPropagation();
  }

  @HostListener('mouseenter') onMouseOver() {
    this._updateSortIconColor('var(--cps-color-line-dark)');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this._updateSortIconColor('');
  }
}
