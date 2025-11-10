import { Component } from '@angular/core';

import { CpsInfoCircleComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-info-circle.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  selector: 'app-info-circle-page',
  imports: [CpsInfoCircleComponent, ComponentDocsViewerComponent],
  templateUrl: './info-circle-page.component.html',
  styleUrls: ['./info-circle-page.component.scss'],
  host: { class: 'composition-page' }
})
export class InfoCirclePageComponent {
  componentData = ComponentData;
}
