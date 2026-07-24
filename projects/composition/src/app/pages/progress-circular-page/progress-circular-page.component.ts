import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CpsIconComponent, CpsProgressCircularComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import ComponentData from '../../api-data/cps-progress-circular.json';
import { progressCircularExamples } from './progress-circular-page.examples';

@Component({
  imports: [
    CpsIconComponent,
    CpsProgressCircularComponent,
    ComponentDocsViewerComponent,
    RouterModule,
    CodeExampleComponent
  ],
  selector: 'app-progress-circular-page',
  templateUrl: './progress-circular-page.component.html',
  styleUrls: ['./progress-circular-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressCircularPageComponent {
  componentData = ComponentData;
  readonly examples = progressCircularExamples;
}
