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
import { CpsInputComponent } from '../../../cps-input/cps-input.component';
import { CpsDatepickerComponent } from '../../../cps-datepicker/cps-datepicker.component';
import { CpsAutocompleteComponent } from '../../../cps-autocomplete/cps-autocomplete.component';
import {
  CpsButtonToggleOption,
  CpsButtonToggleComponent
} from '../../../cps-button-toggle/cps-button-toggle.component';
import { TreeTable } from 'primeng/treetable';
import {
  CpsColumnFilterCategoryOption,
  CpsColumnFilterType
} from '../../cps-column-filter-types';

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
  @Input() type: CpsColumnFilterType = 'text';
  @Input() field: string | undefined;
  @Input() filterConstraint: FilterMetadata | undefined;
  @Input() categoryOptions: CpsColumnFilterCategoryOption[] | string[] = [];
  @Input() asButtonToggle = false; // for category type only
  @Input() singleSelection = false; // for category type only
  @Input() placeholder = '';
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
        fillCats(this._tableInstance.value);
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

    if (value === '' || !this.hasApplyButton) {
      this._tableInstance._filter();
    }
  }

  onEnterKeyDown(event: any) {
    this._tableInstance._filter();
    event.preventDefault();
  }
}
