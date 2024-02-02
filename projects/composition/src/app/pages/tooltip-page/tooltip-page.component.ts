import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CpsButtonComponent,
  CpsCheckboxComponent,
  CpsTooltipDirective
} from 'cps-ui-kit';

import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

import ComponentData from '../../api-data/cps-tooltip.json';

@Component({
  selector: 'tooltip-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsButtonComponent,
    CpsTooltipDirective,
    CpsCheckboxComponent,
    ComponentDocsViewerComponent
  ],
  templateUrl: './tooltip-page.component.html',
  styleUrls: ['./tooltip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TooltipPageComponent {
  componentData = ComponentData;
  ttipEnabled = false;
}
