import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsDatepickerComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

import ComponentData from '../../api-data/cps-datepicker.json';

@Component({
  standalone: true,
  imports: [
    CpsDatepickerComponent,
    FormsModule,
    ReactiveFormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-datepicker-page',
  templateUrl: './datepicker-page.component.html',
  styleUrls: ['./datepicker-page.component.scss'],
  host: { class: 'composition-page' }
})
export class DatepickerPageComponent implements OnInit {
  form!: UntypedFormGroup;
  syncVal = null;
  today = new Date();

  defaultDate = new Date(2023, 2, 16);
  minDate = new Date(2023, 0, 1);
  maxDate = new Date(2025, 11, 31);

  componentData = ComponentData;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredDatepicker: [null, [Validators.required]]
    });
  }
}
