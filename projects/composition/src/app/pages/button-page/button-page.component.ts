import { Component } from '@angular/core';
import { CpsButtonComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';

import ComponentData from '../../api-data/cps-button.json';
import { buttonExamples } from './button-page.examples';

@Component({
  imports: [
    CpsButtonComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  selector: 'app-button-page',
  templateUrl: './button-page.component.html',
  styleUrls: ['./button-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonPageComponent {
  componentData = ComponentData;
  isLoading = false;

  onClickForLoading() {
    this.isLoading = true;
    setTimeout(() => (this.isLoading = false), 2000);
  }

  readonly examples = buttonExamples;
}
