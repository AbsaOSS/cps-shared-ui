import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CpsButtonComponent,
  CpsCheckboxComponent,
  CpsTooltipDirective
} from 'cps-ui-kit';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';
import ComponentData from '../../api-data/cps-tooltip.json';
import { tooltipExamples } from './tooltip-page.examples';

@Component({
  selector: 'tooltip-page',
  imports: [
    FormsModule,
    CpsButtonComponent,
    CpsTooltipDirective,
    CpsCheckboxComponent,
    ComponentDocsViewerComponent,
    CodeExampleComponent
  ],
  templateUrl: './tooltip-page.component.html',
  styleUrls: ['./tooltip-page.component.scss'],
  host: { class: 'composition-page' }
})
export class TooltipPageComponent {
  componentData = ComponentData;
  ttipEnabled = false;
  readonly examples = tooltipExamples;
}
