import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { CpsInputComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-input.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsInputComponent,
    ReactiveFormsModule,
    FormsModule,
    DocsViewerComponent
  ],
  selector: 'app-input-page',
  templateUrl: './input-page.component.html',
  styleUrls: ['./input-page.component.scss'],
  host: { class: 'composition-page' }
})
export class InputPageComponent implements OnInit {
  form!: UntypedFormGroup;
  syncVal = '';
  componentData = ComponentData;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.form = this._formBuilder.group({
      requiredInput: [
        '',
        [
          Validators.required,
          (control: AbstractControl): ValidationErrors | null =>
            this._checkDigits(control)
        ]
      ]
    });
  }

  private _checkDigits(control: AbstractControl) {
    const val = control.value;
    if (!val) return null;

    if (!/\b\d{8}\b/g.test(val)) {
      return { mustMatch8Dig: 'Field must contain exactly 8 digits' };
    }
    return null;
  }
}
