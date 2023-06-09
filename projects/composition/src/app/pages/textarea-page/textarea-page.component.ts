import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsTextareaComponent } from 'cps-ui-kit';

@Component({
  standalone: true,
  selector: 'app-textarea-page',
  imports: [CpsTextareaComponent, ReactiveFormsModule],
  templateUrl: './textarea-page.component.html',
  styleUrls: ['./textarea-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TextareaPageComponent implements OnInit {
  form!: UntypedFormGroup;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.form = this._formBuilder.group({
      requiredTextarea: ['', [Validators.required]]
    });
  }
}
