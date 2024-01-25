import { Component } from '@angular/core';
import { CpsPaginatorComponent } from 'cps-ui-kit';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

import ComponentData from '../../api-data/cps-paginator.json';

@Component({
  selector: 'app-paginator-page',
  standalone: true,
  imports: [CpsPaginatorComponent, DocsViewerComponent],
  templateUrl: './paginator-page.component.html',
  styleUrls: ['./paginator-page.component.scss'],
  host: { class: 'composition-page' }
})
export class PaginatorPageComponent {
  componentData = ComponentData;
}
