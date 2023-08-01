import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FilterMatchMode,
  FilterMetadata,
  FilterOperator,
  SelectItem
} from 'primeng/api';
import { Table } from 'primeng/table';
import { CpsButtonComponent } from '../../cps-button/cps-button.component';
import { CpsMenuComponent } from '../../cps-menu/cps-menu.component';
import { CpsIconComponent } from '../../cps-icon/cps-icon.component';
import { CpsSelectComponent } from '../../cps-select/cps-select.component';

export type CpsTableColumnType =
  | 'text'
  | 'numeric'
  | 'date'
  | 'category'
  | 'boolean';

@Component({
  selector: 'cps-table-column-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsButtonComponent,
    CpsMenuComponent,
    CpsIconComponent,
    CpsSelectComponent
  ],
  templateUrl: './cps-table-column-filter.component.html',
  styleUrls: ['./cps-table-column-filter.component.scss']
})
export class CpsTableColumnFilterComponent {
  @Input() field: string | undefined;

  @Input() type = 'text';

  @Input() matchMode: string | undefined;

  @Input() operator: string = FilterOperator.AND;

  @Input() showOperator = true;

  @Input() showClearButton = true;

  @Input() showApplyButton = true;

  @Input() showMatchModes = true;

  @Input() showAddButton = true;

  @Input() hideOnClear = false;

  @Input() placeholder: string | undefined;

  @Input() maxConstraints = 2;

  @Input() minFractionDigits: number | undefined;

  @Input() maxFractionDigits: number | undefined;

  @Input() prefix: string | undefined;

  @Input() suffix: string | undefined;

  @Input() locale: string | undefined;

  @Input() localeMatcher: string | undefined;

  @Input() currency: string | undefined;

  @Input() currencyDisplay: string | undefined;

  @Input() useGrouping = true;

  @Input() showButtons = true;

  operatorOptions = [
    { label: 'Match All', value: FilterOperator.AND, info: 'AND' },
    { label: 'Match Any', value: FilterOperator.OR, info: 'OR' }
  ];

  private labels = {
    startsWith: 'Starts with',
    contains: 'Contains',
    notContains: 'Does Not contain',
    endsWith: 'Ends with',
    equals: 'Equals',
    notEquals: 'Does Not equal',
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
      FilterMatchMode.STARTS_WITH,
      FilterMatchMode.CONTAINS,
      FilterMatchMode.NOT_CONTAINS,
      FilterMatchMode.ENDS_WITH,
      FilterMatchMode.EQUALS,
      FilterMatchMode.NOT_EQUALS
    ],
    numeric: [
      FilterMatchMode.EQUALS,
      FilterMatchMode.NOT_EQUALS,
      FilterMatchMode.LESS_THAN,
      FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
      FilterMatchMode.GREATER_THAN,
      FilterMatchMode.GREATER_THAN_OR_EQUAL_TO
    ],
    date: [
      FilterMatchMode.DATE_IS,
      FilterMatchMode.DATE_IS_NOT,
      FilterMatchMode.DATE_BEFORE,
      FilterMatchMode.DATE_AFTER
    ],
    category: [FilterMatchMode.EQUALS, FilterMatchMode.NOT_EQUALS]
  } as { [key: string]: string[] };

  matchModes: SelectItem[] | undefined;

  @ViewChild('columnFilterMenu')
  columnFilterMenu!: CpsMenuComponent;

  // eslint-disable-next-line no-useless-constructor
  constructor(public elementRef: ElementRef, public dt: Table) {}

  ngOnInit() {
    if (!this.dt.filters[<string>this.field]) {
      this.initFieldFilterConstraint();
    }

    this.matchModes = this.filterMatchModeOptions[this.type]?.map(
      (key: string) => {
        return { label: this.labels[key], value: key };
      }
    );
  }

  initFieldFilterConstraint() {
    const defaultMatchMode = this.getDefaultMatchMode();
    this.dt.filters[<string>this.field] = [
      {
        value: null,
        matchMode: defaultMatchMode,
        operator: this.operator
      }
    ];
  }

  onMenuMatchModeChange(value: any, filterMeta: FilterMetadata) {
    filterMeta.matchMode = value;

    if (!this.showApplyButton) {
      this.dt._filter();
    }
  }

  addConstraint() {
    (<FilterMetadata[]>this.dt.filters[<string>this.field]).push({
      value: null,
      matchMode: this.getDefaultMatchMode(),
      operator: this.getDefaultOperator()
    });
  }

  removeConstraint(filterMeta: FilterMetadata) {
    this.dt.filters[<string>this.field] = (<FilterMetadata[]>(
      this.dt.filters[<string>this.field]
    )).filter((meta) => meta !== filterMeta);
    this.dt._filter();
  }

  onOperatorChange(value: any) {
    (<FilterMetadata[]>this.dt.filters[<string>this.field]).forEach(
      (filterMeta) => {
        filterMeta.operator = value;
        this.operator = value;
      }
    );

    if (!this.showApplyButton) {
      this.dt._filter();
    }
  }

  getDefaultMatchMode(): string {
    if (this.matchMode) {
      return this.matchMode;
    } else {
      if (this.type === 'text') return FilterMatchMode.STARTS_WITH;
      else if (this.type === 'numeric') return FilterMatchMode.EQUALS;
      else if (this.type === 'date') return FilterMatchMode.DATE_IS;
      else return FilterMatchMode.CONTAINS;
    }
  }

  getDefaultOperator(): string | undefined {
    return this.dt.filters
      ? (<FilterMetadata[]>this.dt.filters[<string>(<string>this.field)])[0]
          .operator
      : this.operator;
  }

  get fieldConstraints(): FilterMetadata[] | undefined | null {
    return this.dt.filters
      ? <FilterMetadata[]>this.dt.filters[<string>this.field]
      : null;
  }

  get showRemoveIcon(): boolean {
    return this.fieldConstraints ? this.fieldConstraints.length > 1 : false;
  }

  get isShowOperator(): boolean {
    return (
      this.showOperator && this.maxConstraints > 1 && this.type !== 'boolean'
    );
  }

  get isShowAddConstraint(): boolean | undefined | null {
    return (
      this.showAddButton &&
      this.type !== 'boolean' &&
      this.fieldConstraints &&
      this.fieldConstraints.length < this.maxConstraints
    );
  }

  hasFilter(): boolean {
    const fieldFilter = this.dt.filters[<string>this.field];
    if (fieldFilter) {
      if (Array.isArray(fieldFilter))
        return !this.dt.isFilterBlank((<FilterMetadata[]>fieldFilter)[0].value);
      else return !this.dt.isFilterBlank(fieldFilter.value);
    }

    return false;
  }

  hide() {
    this.columnFilterMenu.hide();
  }

  clearFilter() {
    this.initFieldFilterConstraint();
    this.dt._filter();
    if (this.hideOnClear) this.hide();
  }

  applyFilter() {
    this.dt._filter();
    this.hide();
  }

  onMenuShown() {
    const parent = this.elementRef?.nativeElement?.parentElement;
    const className = 'cps-table-col-filter-menu-open';
    parent.classList.add(className);
  }

  onMenuHidden() {
    const parent = this.elementRef?.nativeElement?.parentElement;
    const className = 'cps-table-col-filter-menu-open';
    parent.classList.remove(className);
  }
}
