import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsCheckboxComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-checkbox.json';
import { DocsViewerComponent } from '../../components/docs-viewer/docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsCheckboxComponent,
    ReactiveFormsModule,
    FormsModule,
    DocsViewerComponent
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
