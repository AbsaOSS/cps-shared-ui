import { Component } from '@angular/core';
import { CpsSchedulingComponent } from 'cps-ui-kit';
import ComponentData from '../../api-data/cps-scheduling.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  selector: 'app-scheduling-page',
  standalone: true,
  imports: [CpsSchedulingComponent, ComponentDocsViewerComponent],
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.scss',
  host: { class: 'composition-page' }
})
export class SchedulingPageComponent {
  componentData = ComponentData;
}
