import { Component } from '@angular/core';
import { CpsExpansionPanelComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-expansion-panel.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  standalone: true,
  imports: [CpsExpansionPanelComponent, ComponentDocsViewerComponent],
  selector: 'app-expansion-panel-page',
  templateUrl: './expansion-panel-page.component.html',
  styleUrls: ['./expansion-panel-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ExpansionPanelPageComponent {
  componentData = ComponentData;
}
