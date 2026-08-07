import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { CpsTextareaComponent } from 'cps-ui-kit';
import ComponentData from '../../api-data/cps-textarea.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { textareaExamples } from './textarea-page.examples';

@Component({
  selector: 'app-textarea-page',
  imports: [
    CpsTextareaComponent,
    ReactiveFormsModule,
    FormsModule,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './textarea-page.component.html',
  styleUrls: ['./textarea-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TextareaPageComponent implements OnInit {
  form!: UntypedFormGroup;
  syncVal = '';
  componentData = ComponentData;
  readonly examples = textareaExamples;

  // eslint-disable-next-line no-useless-constructor
  constructor(private _formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    this.form = this._formBuilder.group({
      requiredTextarea: ['', [Validators.required, Validators.maxLength(3)]]
    });
  }
}
