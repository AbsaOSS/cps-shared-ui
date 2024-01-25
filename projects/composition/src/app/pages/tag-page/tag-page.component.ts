import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsTagComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-tag.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsTagComponent,
    ReactiveFormsModule,
    FormsModule,
    DocsViewerComponent
  ],
  selector: 'app-tag-page',
  templateUrl: './tag-page.component.html',
  styleUrls: ['./tag-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TagPageComponent {
  syncVal = true;
  componentData = ComponentData;
}
