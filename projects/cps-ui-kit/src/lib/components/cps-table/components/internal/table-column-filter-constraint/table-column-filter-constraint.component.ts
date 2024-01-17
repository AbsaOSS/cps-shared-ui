import {
  Component,
  Input,
  OnChanges,
  Optional,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterMetadata } from 'primeng/api';
import { Table } from 'primeng/table';
import { TreeTable } from 'primeng/treetable';
import { CpsInputComponent } from '../../../../cps-input/cps-input.component';
import { CpsDatepickerComponent } from '../../../../cps-datepicker/cps-datepicker.component';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from '../../../../cps-button-toggle/cps-button-toggle.component';
import { CpsAutocompleteComponent } from '../../../../cps-autocomplete/cps-autocomplete.component';
import {
  CpsColumnFilterCategoryOption,
  CpsColumnFilterType
} from '../../../cps-column-filter-types';

/**
 * TableColumnFilterConstraintComponent is an internal filtering constraint component in table and treetable.
 * @group Components
 */
@Component({
  selector: 'table-column-filter-constraint',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsInputComponent,
    CpsDatepickerComponent,
    CpsButtonToggleComponent,
    CpsAutocompleteComponent
  ],
  templateUrl: './table-column-filter-constraint.component.html',
  styleUrls: ['./table-column-filter-constraint.component.scss']
})
export class TableColumnFilterConstraintComponent implements OnChanges {
  /**
   * Type of filter constraint.
   * @group Props
   */
  @Input() type: CpsColumnFilterType = 'text';

  /**
   * Column name.
   * @group Props
   */
  @Input() field: string | undefined;

  /**
   * Constraint data.
   * @group Props
   */
  @Input() filterConstraint: FilterMetadata | undefined;

  /**
   * An array of category options.
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
   * Placeholder for input field.
   * @group Props
   */
  @Input() placeholder = '';

  /**
   * Determines whether the filter should have an apply button.
   * @group Props
   */
  @Input() hasApplyButton = true;

  @ViewChild('categoryAutocompleteComponent')
  categoryAutocompleteComponent?: CpsAutocompleteComponent;

  booleanOptions = [
    { label: 'True', value: 'true' },
    { label: 'False', value: 'false' }
  ] as CpsButtonToggleOption[];

  categories: CpsColumnFilterCategoryOption[] = [];

  _tableInstance: Table | TreeTable;

  get isCategoryDropdownOpened() {
    return this.categoryAutocompleteComponent?.isOpened || false;
  }

  constructor(@Optional() public dt: Table, @Optional() public tt: TreeTable) {
    this._tableInstance = dt || tt;
  }

  ngOnChanges(): void {
    this._updateCategories();
  }

  private _updateCategories() {
    if (this.type !== 'category') return;
    if (this.categoryOptions.length > 0) {
      if (typeof this.categoryOptions[0] === 'string') {
        this.categories = (this.categoryOptions as string[]).map((o) => ({
          label: o,
          value: o
        }));
      } else {
        this.categories = this
          .categoryOptions as CpsColumnFilterCategoryOption[];
      }
    } else {
      let cats = [];
      if (this._tableInstance instanceof Table) {
        cats =
          this._tableInstance.value?.map((v) => v[this.field as string]) || [];
      } else {
        const fillCats = (nodes: any[]) => {
          nodes?.forEach((v) => {
            cats.push(v.data[this.field as string]);
            fillCats(v.children);
          });
        };
        // Todo: Use explicit type
        fillCats(this._tableInstance.value as any);
      }
      this.categories =
        Array.from(new Set(cats))?.map((c) => ({
          label: c,
          value: c
        })) || [];
    }
  }

  onValueChange(value: any) {
    (<any>this.filterConstraint).value = value;

    if (this._tableInstance.isFilterBlank(value) || !this.hasApplyButton) {
      this._tableInstance._filter();
    }
  }

  onEnterKeyDown(event: any) {
    this._tableInstance._filter();
    event.preventDefault();
  }
}
