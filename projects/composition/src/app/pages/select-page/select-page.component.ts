import { Component, OnInit } from '@angular/core';
import { CpsSelectComponent } from 'cps-ui-kit';
import {
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

@Component({
  standalone: true,
  imports: [CpsSelectComponent, FormsModule, ReactiveFormsModule],
  selector: 'app-select-page',
  templateUrl: './select-page.component.html',
  styleUrls: ['./select-page.component.scss'],
  host: { class: 'composition-page' },
})
export class SelectPageComponent implements OnInit {
  options = [
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM', info: 'hello' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS', info: 'abcd' },
    { name: 'Tokyo', code: 'TOK', info: 'abcd' },
    { name: 'Capetown', code: 'CPT', info: 'abcd' },
    { name: 'Oslo', code: 'OSL', info: 'abcd' },
    { name: 'Prague', code: 'PRG', info: 'abcd' },
    { name: 'Berlin', code: 'BER', info: 'abcd' },
    { name: 'Moscow', code: 'MOS', info: 'abcd' },
  ];
  selOpt: any = undefined;

  form: any;

  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.selOpt = this.options[2];
    this.form = this._formBuilder.group({
      requiredSelect: [
        this.options[4],
        [
          Validators.required,
          (control: AbstractControl): ValidationErrors | null =>
            this._checkDigits(control),
        ],
      ],
    });
  }

  private _checkDigits(control: AbstractControl) {
    // const val = control.value;
    // if (!val) return null;

    // if (!/\b\d{8}\b/g.test(val)) {
    //   return { mustMatch8Dig: 'Field must contain exactly 8 digits' };
    // }
    return null;
  }
}
