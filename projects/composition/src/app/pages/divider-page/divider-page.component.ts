import { Component } from '@angular/core';
import { CpsDividerComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import ComponentData from '../../api-data/cps-divider.json';
import { dividerExamples } from './divider-page.examples';

@Component({
  selector: 'app-divider-page',
  imports: [
    CpsDividerComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './divider-page.component.html',
  styleUrl: './divider-page.component.scss',
  host: { class: 'composition-page' }
})
export class DividerPageComponent {
  componentData = ComponentData;
  readonly examples = dividerExamples;
}
