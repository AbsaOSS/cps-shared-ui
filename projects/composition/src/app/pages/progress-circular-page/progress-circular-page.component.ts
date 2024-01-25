import { Component } from '@angular/core';
import { CpsProgressCircularComponent } from 'cps-ui-kit';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

import ComponentData from '../../api-data/cps-progress-circular.json';

@Component({
  standalone: true,
  imports: [CpsProgressCircularComponent, DocsViewerComponent],
  selector: 'app-progress-circular-page',
  templateUrl: './progress-circular-page.component.html',
  styleUrls: ['./progress-circular-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressCircularPageComponent {
  componentData = ComponentData;
}
