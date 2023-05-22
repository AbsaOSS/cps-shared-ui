import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  Validators
} from '@angular/forms';
import { CpsAutocompleteComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsAutocompleteComponent, FormsModule, ReactiveFormsModule],
  selector: 'app-autocomplete-page',
  templateUrl: './autocomplete-page.component.html',
  styleUrls: ['./autocomplete-page.component.scss'],
  host: { class: 'composition-page' }
})
export class AutocompletePageComponent implements OnInit {
  options = [
    { name: 'New York', code: 'NY' },
    { name: 'Prague', code: 'PRG', info: 'Prague info' },
    { name: 'Capetown', code: 'CPT', info: 'Capetown info' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN', info: 'London info' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' },
    { name: 'Tokyo', code: 'TOK' },
    { name: 'Oslo', code: 'OSL', info: 'Oslo info' },
    { name: 'Berlin', code: 'BER' }
  ];

  form: any;
  syncVal: any = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredAutocomplete: [this.options[1], [Validators.required]]
    });
  }
}
