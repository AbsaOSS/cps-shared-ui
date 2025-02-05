import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsCheckboxComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-checkbox.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  imports: [
    CpsCheckboxComponent,
    ReactiveFormsModule,
    FormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-checkbox-page',
  templateUrl: './checkbox-page.component.html',
  styleUrls: ['./checkbox-page.component.scss'],
  host: { class: 'composition-page' }
})
export class CheckboxPageComponent {
  syncVal = true;
  componentData = ComponentData;
}
