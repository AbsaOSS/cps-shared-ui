const optionsTs = `
options: CpsButtonToggleOption[] = [
  { label: 'Option 1', value: 'first' },
  { label: 'Option 2', value: 'second' },
  { label: 'Option 3', value: 'third' },
  { label: 'Option 4', value: 'fourth' }
];`;

const iconOptionsTs = `
iconOptions: CpsButtonToggleOption[] = [
  { label: 'Succeeded', value: 'second', icon: 'toast-success' },
  { label: 'Failed', value: 'third', icon: 'toast-error' },
  { label: 'Pending', value: 'first', icon: 'pending' }
];`;

export const buttonToggleExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  basic: {
    html: `
<cps-button-toggle
  label="Single button toggles with a tooltip"
  infoTooltip="Provide any information here"
  [options]="options"
  [value]="options[1].value">
</cps-button-toggle>`,
    ts: optionsTs
  },

  partiallyDisabled: {
    html: `
<cps-button-toggle
  label="Single button toggles with partially disabled options and targeted tooltips"
  [options]="partiallyDisabledOptions"
  [value]="partiallyDisabledOptions[1].value">
</cps-button-toggle>`,
    ts: `
partiallyDisabledOptions: CpsButtonToggleOption[] = [
  { label: 'Option 1', value: 'first', disabled: true, tooltip: 'First option is currently unavailable' },
  { label: 'Option 2', value: 'second' },
  { label: 'Option 3', value: 'third', disabled: true, tooltip: 'Third option is currently unavailable' },
  { label: 'Option 4', value: 'fourth' },
  { label: 'Option 5', value: 'fifth' },
  { label: 'Option 6', value: 'sixth', disabled: true, tooltip: 'Sixth option is currently unavailable' }
];`
  },

  disabled: {
    html: `
<cps-button-toggle
  label="Disabled button toggles"
  [options]="options"
  [disabled]="true"
  [value]="options[1].value">
</cps-button-toggle>`,
    ts: optionsTs
  },

  nonMandatory: {
    html: `
<cps-button-toggle
  label="Single button toggles without mandatory selection"
  [options]="options"
  [value]="options[1].value"
  [mandatory]="false">
</cps-button-toggle>`,
    ts: optionsTs
  },

  multiple: {
    html: `
<cps-button-toggle
  label="Multiple button toggles"
  [options]="options"
  [value]="[options[1].value]"
  [multiple]="true">
</cps-button-toggle>`,
    ts: optionsTs
  },

  multipleNonMandatory: {
    html: `
<cps-button-toggle
  label="Multiple button toggles without mandatory selection"
  [options]="options"
  [value]="[options[1].value]"
  [multiple]="true"
  [mandatory]="false">
</cps-button-toggle>`,
    ts: optionsTs
  },

  iconsUnequalWidths: {
    html: `
<cps-button-toggle
  label="Single button toggles with icons and unequal widths"
  [options]="iconOptions"
  [equalWidths]="false"
  [value]="iconOptions[2].value">
</cps-button-toggle>`,
    ts: iconOptionsTs
  },

  iconsEqualWidths: {
    html: `
<cps-button-toggle
  label="Single button toggles with icons and equal widths"
  [options]="iconOptions"
  [value]="iconOptions[2].value">
</cps-button-toggle>`,
    ts: iconOptionsTs
  },

  iconsOnly: {
    html: `
<cps-button-toggle
  label="Single button toggles only with icons and tooltips"
  optionTooltipPosition="top"
  [options]="iconOnlyOptions">
</cps-button-toggle>`,
    ts: `
iconOnlyOptions: CpsButtonToggleOption[] = [
  { value: 'second', icon: 'toast-success', tooltip: 'Succeeded', ariaLabel: 'Succeeded' },
  { value: 'third', icon: 'toast-error', tooltip: 'Failed', ariaLabel: 'Failed' },
  { value: 'first', icon: 'pending', tooltip: 'Pending', ariaLabel: 'Pending' }
];`
  },

  twoWayBinding: {
    html: `
<cps-button-toggle
  label="Single button toggles with two-way binding"
  [options]="options"
  [(ngModel)]="syncVal"
  [mandatory]="false">
</cps-button-toggle>
<div>Selected value: {{ syncVal }}</div>`,
    ts: `
options: CpsButtonToggleOption[] = [
  { label: 'Option 1', value: 'first' },
  { label: 'Option 2', value: 'second' },
  { label: 'Option 3', value: 'third' },
  { label: 'Option 4', value: 'fourth' }
];
syncVal = 'first';`
  },

  twoWayBindingMultiple: {
    html: `
<cps-button-toggle
  label="Multiple button toggles with two-way binding"
  [options]="options"
  [(ngModel)]="multiSyncVal"
  [multiple]="true"
  [mandatory]="false">
</cps-button-toggle>
<div>Selected values: {{ multiSyncVal }}</div>`,
    ts: `
options: CpsButtonToggleOption[] = [
  { label: 'Option 1', value: 'first' },
  { label: 'Option 2', value: 'second' },
  { label: 'Option 3', value: 'third' },
  { label: 'Option 4', value: 'fourth' }
];
multiSyncVal = ['third', 'fourth'];`
  }
};
