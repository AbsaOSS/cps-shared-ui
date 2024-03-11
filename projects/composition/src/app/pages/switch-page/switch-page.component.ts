import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsSwitchComponent } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-switch.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsSwitchComponent,
    ReactiveFormsModule,
    FormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-switch-page',
  templateUrl: './switch-page.component.html',
  styleUrls: ['./switch-page.component.scss'],
  host: { class: 'composition-page' }
})
export class SwitchPageComponent {
  syncVal = true;
  componentData = ComponentData;
}
