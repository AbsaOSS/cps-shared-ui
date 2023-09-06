import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CpsCheckboxComponent,
  CpsRadioComponent,
  CpsRadioGroupComponent,
  CpsSelectComponent,
  RadioOption
} from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [
    CpsRadioGroupComponent,
    ReactiveFormsModule,
    FormsModule,
    CpsRadioComponent,
    CpsSelectComponent,
    CpsCheckboxComponent
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
  ] as RadioOption[];

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
  ] as RadioOption[];

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
}
