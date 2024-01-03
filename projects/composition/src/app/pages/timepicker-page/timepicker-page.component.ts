import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsTimepickerComponent } from 'cps-ui-kit';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-timepicker-page',
  standalone: true,
  imports: [
    CommonModule,
    CpsTimepickerComponent,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './timepicker-page.component.html',
  styleUrls: ['./timepicker-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TimepickerPageComponent implements OnInit {
  form!: UntypedFormGroup;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.form = this._formBuilder.group({
      requiredTimepicker: ['', [Validators.required]]
    });
  }
}
