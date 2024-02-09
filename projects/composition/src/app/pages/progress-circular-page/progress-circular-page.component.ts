import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CpsProgressCircularComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import ComponentData from '../../api-data/cps-progress-circular.json';

@Component({
  standalone: true,
  imports: [
    CpsProgressCircularComponent,
    ComponentDocsViewerComponent,
    RouterModule
  ],
  selector: 'app-progress-circular-page',
  templateUrl: './progress-circular-page.component.html',
  styleUrls: ['./progress-circular-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressCircularPageComponent {
  componentData = ComponentData;
}
