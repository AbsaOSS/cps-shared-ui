import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsRadioComponent, RadioOption } from 'cps-ui-kit';

@Component({
  standalone: true,
  imports: [CpsRadioComponent, ReactiveFormsModule, FormsModule],
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
    { label: 'Option 1', value: 'first', disabled: true },
    { label: 'Option 2', value: 'second' },
    { label: 'Option 3', value: 'third', disabled: true },
    { label: 'Option 4', value: 'fourth' }
  ] as RadioOption[];

  syncVal = 'first';
}
