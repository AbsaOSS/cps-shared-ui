import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from 'projects/cps-ui-kit/src/public-api';

import ComponentData from '../../api-data/cps-button-toggle.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';

@Component({
  standalone: true,
  imports: [
    CpsButtonToggleComponent,
    ReactiveFormsModule,
    FormsModule,
    ComponentDocsViewerComponent
  ],
  selector: 'app-button-toggle-page',
  templateUrl: './button-toggle-page.component.html',
  styleUrls: ['./button-toggle-page.component.scss'],
  host: { class: 'composition-page' }
})
export class ButtonTogglePageComponent {
  options: CpsButtonToggleOption[] = [
    { label: 'Option 1', value: 'first' },
    { label: 'Option 2', value: 'second' },
    { label: 'Option 3', value: 'third' },
    { label: 'Option 4', value: 'fourth' }
  ];

  iconOptions: CpsButtonToggleOption[] = [
    { label: 'Succeeded', value: 'second', icon: 'toast-success' },
    { label: 'Failed', value: 'third', icon: 'toast-error' },
    { label: 'Pending', value: 'first', icon: 'pending' }
  ];

  iconOnlyOptions: CpsButtonToggleOption[] = [
    { value: 'second', icon: 'toast-success', tooltip: 'Succeeded' },
    { value: 'third', icon: 'toast-error', tooltip: 'Failed' },
    { value: 'first', icon: 'pending', tooltip: 'Pending' }
  ];

  partiallyDisabledOptions: CpsButtonToggleOption[] = [
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
  ];

  syncVal = 'first';
  multiSyncVal = ['third', 'fourth'];
  componentData = ComponentData;
}
