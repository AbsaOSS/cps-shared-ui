import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CpsCheckboxComponent,
  CpsRadioComponent,
  CpsRadioGroupComponent,
  CpsSelectComponent,
  CpsRadioOption
} from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-radio-group.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsRadioGroupComponent,
    ReactiveFormsModule,
    FormsModule,
    CpsRadioComponent,
    CpsSelectComponent,
    CpsCheckboxComponent,
    ComponentDocsViewerComponent
  ],
  selector: 'app-radio-page',
  templateUrl: './radio-page.component.html',
  styleUrls: ['./radio-page.component.scss'],
  host: { class: 'composition-page' }
})
export class RadioPageComponent {
  options = [
    { label: 'Option 1', value: 'first' },
    { label: 'Option 2', value: 'second' },
    { label: 'Option 3', value: 'third' }
  ] as CpsRadioOption[];

  partiallyDisabledOptions = [
    {
      label: 'Option 1',
      value: 'first',
      disabled: true,
      tooltip: 'First option is currently unavailable'
    },
    { label: 'Option 2', value: 'second' },
    {
      label: 'Option 3',
      value: 'third',
      disabled: true,
      tooltip: 'Third option is currently unavailable'
    },
    { label: 'Option 4', value: 'fourth' }
  ] as CpsRadioOption[];

  syncVal = 'first';

  dayOptions = [
    { name: '1st day', data: { code: '1' } },
    { name: '2nd day', data: { code: '2' } },
    { name: '3rd day', data: { code: '3' } }
  ];

  monthOptions = [...Array(12).keys()].map((n) => ({
    name: n + 1,
    data: { code: n + 1 }
  }));

  hourOptions = [...Array(24).keys()].map((n) => ({
    name: n,
    data: { code: n }
  }));

  minuteOptions = [...Array(60).keys()].map((n) => ({
    name: n,
    data: { code: n }
  }));

  componentData = ComponentData;
}
