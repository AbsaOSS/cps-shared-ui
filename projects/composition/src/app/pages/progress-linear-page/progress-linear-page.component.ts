import { CombineLabelsPipe } from './../../../../../cps-ui-kit/src/lib/pipes/internal/combine-labels.pipe';
import { Component } from '@angular/core';
import { CpsProgressLinearComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-progress-linear.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [CpsProgressLinearComponent, DocsViewerComponent],
  selector: 'app-progress-linear-page',
  templateUrl: './progress-linear-page.component.html',
  styleUrls: ['./progress-linear-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ProgressLinearPageComponent {
  componentData = ComponentData;
}
