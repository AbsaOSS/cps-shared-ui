import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CpsButtonComponent, CpsInputComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';

import ComponentData from '../../api-data/cps-button.json';
import { buttonExamples } from './button-page.examples';

@Component({
  imports: [
    CpsButtonComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent,
    CpsInputComponent,
    ReactiveFormsModule
  ],
  selector: 'app-button-page',
  templateUrl: './button-page.component.html',
  styleUrls: ['./button-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonPageComponent {
  private readonly fb = inject(FormBuilder);

  componentData = ComponentData;
  isLoading = false;

  nativeForm = this.fb.nonNullable.group({
    name: ['', Validators.required]
  });

  nativeSubmitMessage = '';

  onClickForLoading() {
    this.isLoading = true;
    setTimeout(() => (this.isLoading = false), 2000);
  }

  onNativePlainClick() {
    this.nativeSubmitMessage = 'Plain button clicked (no form action).';
  }

  onNativeSubmit(event: Event) {
    event.preventDefault();
    if (this.nativeForm.invalid) {
      this.nativeSubmitMessage = 'Form is invalid.';
      return;
    }
    this.nativeSubmitMessage = `Form submitted with name: "${this.nativeForm.value.name}"`;
  }

  onNativeReset() {
    this.nativeForm.reset();
    this.nativeSubmitMessage = '';
  }

  readonly examples = buttonExamples;
}
