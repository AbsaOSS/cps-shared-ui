import { Component } from '@angular/core';
import { CpsButtonComponent, CpsExpansionPanelComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-expansion-panel.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import { expansionPanelExamples } from './expansion-panel-page.examples';

@Component({
  imports: [
    CpsExpansionPanelComponent,
    ComponentDocsViewerComponent,
    CpsButtonComponent,
    CodeExampleComponent
  ],
  selector: 'app-expansion-panel-page',
  templateUrl: './expansion-panel-page.component.html',
  styleUrls: ['./expansion-panel-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ExpansionPanelPageComponent {
  componentData = ComponentData;
  readonly examples = expansionPanelExamples;
}
