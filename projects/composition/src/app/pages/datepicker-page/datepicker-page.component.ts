import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsDatepickerComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsDatepickerComponent, FormsModule, ReactiveFormsModule],
  selector: 'app-datepicker-page',
  templateUrl: './datepicker-page.component.html',
  styleUrls: ['./datepicker-page.component.scss'],
  host: { class: 'composition-page' }
})
export class DatepickerPageComponent implements OnInit {
  form!: UntypedFormGroup;
  syncVal = null;
  today = new Date();

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      requiredDatepicker: [null, [Validators.required]]
    });
  }
}
