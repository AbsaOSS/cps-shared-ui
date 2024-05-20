import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsSelectComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-select.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-select-page',
  templateUrl: './select-page.component.html',
  styleUrls: ['./select-page.component.scss'],
  host: { class: 'composition-page' }
})
export class SelectPageComponent implements OnInit {
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

  statusOptions = [
    { name: 'Success', icon: 'circle', color: 'success' },
    { name: 'Pending', icon: 'circle', color: 'info' },
    { name: 'Warning', icon: 'circle', color: 'warn' },
    { name: 'Failed', icon: 'circle', color: 'error' }
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

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredSelect: [this.options[1], [Validators.required]]
    });
  }
}
