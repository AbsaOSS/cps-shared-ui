import { Component } from '@angular/core';
import { CpsDividerComponent } from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

import ComponentData from '../../api-data/cps-divider.json';

@Component({
  selector: 'app-divider-page',
  standalone: true,
  imports: [CpsDividerComponent, ComponentDocsViewerComponent],
  templateUrl: './divider-page.component.html',
  styleUrl: './divider-page.component.scss',
  host: { class: 'composition-page' }
})
export class DividerPageComponent {
  componentData = ComponentData;
}
