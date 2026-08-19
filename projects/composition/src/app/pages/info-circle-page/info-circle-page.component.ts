import { Component } from '@angular/core';

import { CpsInfoCircleComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-info-circle.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { infoCircleExamples } from './info-circle-page.examples';

@Component({
  selector: 'app-info-circle-page',
  imports: [
    CpsInfoCircleComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './info-circle-page.component.html',
  host: { class: 'composition-page' }
})
export class InfoCirclePageComponent {
  componentData = ComponentData;
  readonly examples = infoCircleExamples;
}
