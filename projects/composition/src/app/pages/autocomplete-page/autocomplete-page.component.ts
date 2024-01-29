import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsAutocompleteComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import ComponentData from '../../api-data/cps-autocomplete.json';

@Component({
  standalone: true,
  imports: [
    CpsAutocompleteComponent,
    FormsModule,
    ReactiveFormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-autocomplete-page',
  templateUrl: './autocomplete-page.component.html',
  styleUrls: ['./autocomplete-page.component.scss'],
  host: { class: 'composition-page' }
})
export class AutocompletePageComponent implements OnInit {
  options = [
    { name: 'New York', data: { code: 'NY' } },
    { name: 'Prague', data: { code: 'PRG' }, info: 'Prague info' },
    { name: 'Capetown', data: { code: 'CPT' }, info: 'Capetown info' },
    { name: 'Rome', data: { code: 'RM' } },
    { name: 'London', data: { code: 'LDN' }, info: 'London info' },
    { name: 'Istanbul', data: { code: 'IST' } },
    { name: 'Paris', data: { code: 'PRS' } },
    { name: 'Tokyo', data: { code: 'TOK' } },
    { name: 'Oslo', data: { code: 'OSL' }, info: 'Oslo info' },
    { name: 'Berlin', data: { code: 'BER' } }
  ];

  syncOptions = [
    { title: 'Amazon', val: 'AMZN', ticker: 'AMZN' },
    { title: 'Apple', val: 'AAPL', ticker: 'AAPL' },
    { title: 'Google', val: 'GOOGL', ticker: 'GOOGL' },
    { title: 'Meta', val: 'META', ticker: 'META' },
    { title: 'Microsoft', val: 'MSFT', ticker: 'MSFT' },
    { title: 'Netflix', val: 'NFLX', ticker: 'NFLX' },
    { title: 'Tesla', val: 'TSLA', ticker: 'TSLA' }
  ];

  form!: UntypedFormGroup;
  syncVal: any = [];
  componentData = ComponentData;

  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredAutocomplete: [this.options[1], [Validators.required]]
    });
  }
}
