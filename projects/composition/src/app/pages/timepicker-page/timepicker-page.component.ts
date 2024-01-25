import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsTime, CpsTimepickerComponent } from 'cps-ui-kit';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

import ComponentData from '../../api-data/cps-timepicker.json';

@Component({
  selector: 'app-timepicker-page',
  standalone: true,
  imports: [
    CommonModule,
    CpsTimepickerComponent,
    ReactiveFormsModule,
    FormsModule,
    DocsViewerComponent
  ],
  templateUrl: './timepicker-page.component.html',
  styleUrls: ['./timepicker-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TimepickerPageComponent implements OnInit {
  form!: UntypedFormGroup;

  syncVal: CpsTime = {
    hours: '05',
    minutes: '10',
    seconds: '10',
    dayPeriod: 'PM'
  };

  val24: CpsTime = {
    hours: '22',
    minutes: '59',
    seconds: '59'
  };

  componentData = ComponentData;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    const defVal: CpsTime = {
      hours: '11',
      minutes: '10',
      dayPeriod: 'PM'
    };
    this.form = this._formBuilder.group({
      requiredTimepicker: [defVal, [Validators.required]]
    });
  }

  onValueChanged(val: CpsTime) {
    console.log('onValueChanged', val);
  }
}
