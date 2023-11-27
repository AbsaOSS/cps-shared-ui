import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
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
  ] as CpsButtonToggleOption[];

  iconOptions = [
    { label: 'Succeeded', value: 'second', icon: 'toast-success' },
    { label: 'Failed', value: 'third', icon: 'toast-error' },
    { label: 'Pending', value: 'first', icon: 'pending' }
  ] as CpsButtonToggleOption[];

  iconOnlyOptions = [
    { value: 'second', icon: 'toast-success', tooltip: 'Succeeded' },
    { value: 'third', icon: 'toast-error', tooltip: 'Failed' },
    { value: 'first', icon: 'pending', tooltip: 'Pending' }
  ] as CpsButtonToggleOption[];

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
    { label: 'Option 4', value: 'fourth' },
    { label: 'Option 5', value: 'fifth' },
    {
      label: 'Option 6',
      value: 'sixth',
      disabled: true,
      tooltip: 'Sixth option is currently unavailable'
    }
  ] as CpsButtonToggleOption[];

  syncVal = 'first';
  multiSyncVal = ['third', 'fourth'];
}
