import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterMetadata } from 'primeng/api';
import { Table } from 'primeng/table';
import { CpsInputComponent } from '../../../cps-input/cps-input.component';
import { CpsDatepickerComponent } from '../../../cps-datepicker/cps-datepicker.component';
import { CpsAutocompleteComponent } from '../../../cps-autocomplete/cps-autocomplete.component';
import {
  BtnToggleOption,
  CpsButtonToggleComponent
} from '../../../cps-button-toggle/cps-button-toggle.component';

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
export class TableColumnFilterConstraintComponent implements OnInit {
  @Input() type: string | undefined;
  @Input() field: string | undefined;
  @Input() filterConstraint: FilterMetadata | undefined;
  @Input() categoryOptions: string[] = [];
  @Input() placeholder = '';
  @Input() hasApplyButton = true;

  booleanOptions = [
    { label: 'True', value: 'true' },
    { label: 'False', value: 'false' }
  ] as BtnToggleOption[];

  categories: { label: string; value: string }[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(public dt: Table) {}

  ngOnInit(): void {
    if (this.type === 'category') {
      if (this.categoryOptions.length > 0) {
        this.categories = this.categoryOptions.map((o) => ({
          label: o,
          value: o
        }));
      } else {
        this.categories =
          Array.from(
            new Set(this.dt.value?.map((v) => v[this.field as string]) || [])
          )?.map((c) => ({
            label: c,
            value: c
          })) || [];
      }
    }
  }

  onValueChange(value: any) {
    (<any>this.filterConstraint).value = value;

    if (value === '' || !this.hasApplyButton) {
      this.dt._filter();
    }
  }

  onInputEnterKeyDown(event: any) {
    this.dt._filter();
    event.preventDefault();
  }
}
