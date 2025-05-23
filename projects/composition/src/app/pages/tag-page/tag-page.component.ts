import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsTagComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-tag.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  imports: [
    CpsTagComponent,
    ReactiveFormsModule,
    FormsModule,
    ComponentDocsViewerComponent
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
