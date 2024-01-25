import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpsInfoCircleComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-info-circle.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  selector: 'app-info-circle-page',
  standalone: true,
  imports: [CommonModule, CpsInfoCircleComponent, DocsViewerComponent],
  templateUrl: './info-circle-page.component.html',
  styleUrls: ['./info-circle-page.component.scss'],
  host: { class: 'composition-page' }
})
export class InfoCirclePageComponent {
  componentData = ComponentData;
}
