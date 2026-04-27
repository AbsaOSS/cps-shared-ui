export const buttonToggleExamples = {
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
