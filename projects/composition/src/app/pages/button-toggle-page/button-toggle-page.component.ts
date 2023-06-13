import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CpsButtonToggleComponent,
  BtnToggleOption
} from 'projects/cps-ui-kit/src/public-api';

@Component({
  standalone: true,
  imports: [CpsButtonToggleComponent, ReactiveFormsModule, FormsModule],
  selector: 'app-button-toggle-page',
  templateUrl: './button-toggle-page.component.html',
  styleUrls: ['./button-toggle-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonTogglePageComponent {
  options = [
    { label: 'Option 1', value: 'first' },
    { label: 'Option 2', value: 'second' },
    { label: 'Option 3', value: 'third' },
    { label: 'Option 4', value: 'fourth' }
  ] as BtnToggleOption[];

  partiallyDisabledOptions = [
    { label: 'Option 1', value: 'first', disabled: true },
    { label: 'Option 2', value: 'second' },
    { label: 'Option 3', value: 'third', disabled: true },
    { label: 'Option 4', value: 'fourth' }
  ] as BtnToggleOption[];

  syncVal = 'first';
  multiSyncVal = ['third', 'fourth'];
}
