import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CpsButtonToggleComponent, CpsButtonToggleOption } from 'cps-ui-kit';

import ComponentData from '../../api-data/cps-button-toggle.json';
import { ComponentDocsViewerComponent } from '../../components/component-docs-viewer/component-docs-viewer.component';
import { CodeExampleComponent } from '../../components/code-example/code-example.component';

@Component({
  imports: [
    CpsButtonToggleComponent,
    ReactiveFormsModule,
    FormsModule,
    ComponentDocsViewerComponent,
    CodeExampleComponent
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
    {
      value: 'second',
      icon: 'toast-success',
      tooltip: 'Succeeded',
      ariaLabel: 'Succeeded'
    },
    {
      value: 'third',
      icon: 'toast-error',
      tooltip: 'Failed',
      ariaLabel: 'Failed'
    },
    {
      value: 'first',
      icon: 'pending',
      tooltip: 'Pending',
      ariaLabel: 'Pending'
    }
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

  readonly examples = {
    basic: `
<cps-button-toggle
  label="Single button toggles with a tooltip"
  infoTooltip="Provide any information here"
  [options]="options"
  [value]="options[1].value">
</cps-button-toggle>`,

    partiallyDisabled: `
<cps-button-toggle
  label="Single button toggles with partially disabled options and targeted tooltips"
  [options]="partiallyDisabledOptions"
  [value]="partiallyDisabledOptions[1].value">
</cps-button-toggle>`,

    disabled: `
<cps-button-toggle
  label="Disabled button toggles"
  [options]="options"
  [disabled]="true"
  [value]="options[1].value">
</cps-button-toggle>`,

    nonMandatory: `
<cps-button-toggle
  label="Single button toggles without mandatory selection"
  [options]="options"
  [value]="options[1].value"
  [mandatory]="false">
</cps-button-toggle>`,

    multiple: `
<cps-button-toggle
  label="Multiple button toggles"
  [options]="options"
  [value]="[options[1].value]"
  [multiple]="true">
</cps-button-toggle>`,

    multipleNonMandatory: `
<cps-button-toggle
  label="Multiple button toggles without mandatory selection"
  [options]="options"
  [value]="[options[1].value]"
  [multiple]="true"
  [mandatory]="false">
</cps-button-toggle>`,

    iconsUnequalWidths: `
<cps-button-toggle
  label="Single button toggles with icons and unequal widths"
  [options]="iconOptions"
  [equalWidths]="false"
  [value]="iconOptions[2].value">
</cps-button-toggle>`,

    iconsEqualWidths: `
<cps-button-toggle
  label="Single button toggles with icons and equal widths"
  [options]="iconOptions"
  [value]="iconOptions[2].value">
</cps-button-toggle>`,

    iconsOnly: `
<cps-button-toggle
  label="Single button toggles only with icons and tooltips"
  optionTooltipPosition="top"
  [options]="iconOnlyOptions">
</cps-button-toggle>`,

    twoWayBinding: `
<cps-button-toggle
  label="Single button toggles with two-way binding"
  [options]="options"
  [(ngModel)]="syncVal"
  [mandatory]="false">
</cps-button-toggle>
<div>Selected value: {{ syncVal }}</div>`,

    twoWayBindingMultiple: `
<cps-button-toggle
  label="Multiple button toggles with two-way binding"
  [options]="options"
  [(ngModel)]="multiSyncVal"
  [multiple]="true"
  [mandatory]="false">
</cps-button-toggle>
<div>Selected values: {{ multiSyncVal }}</div>`
  };
}
