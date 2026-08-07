import { Component } from '@angular/core';
import { CpsProgressLinearComponent } from 'cps-ui-kit';
import ComponentData from '../../api-data/cps-progress-linear.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { progressLinearExamples } from './progress-linear-page.examples';

@Component({
  imports: [
    CpsProgressLinearComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  selector: 'app-progress-linear-page',
  templateUrl: './progress-linear-page.component.html',
  styleUrls: ['./progress-linear-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressLinearPageComponent {
  componentData = ComponentData;
  readonly examples = progressLinearExamples;
}
