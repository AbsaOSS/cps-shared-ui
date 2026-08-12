export const checkboxExamples: Record<string, { html: string; ts?: string }> = {
  default: {
    html: `
<cps-checkbox
  label="Checkbox with tooltip"
  [value]="false"
  infoTooltip="Provide any information here">
</cps-checkbox>
<cps-checkbox label="Basic checkbox" [value]="true"></cps-checkbox>
<cps-checkbox ariaLabel="Unlabeled checkbox" [value]="true"></cps-checkbox>
<cps-checkbox
  label="Checkbox with icon"
  [value]="false"
  icon="avatar"></cps-checkbox>
<cps-checkbox
  label="Checkbox with custom icon color"
  [value]="true"
  icon="settings"
  iconColor="luxury"></cps-checkbox>`
  },

  disabled: {
    html: `
<cps-checkbox
  label="Disabled checkbox checked"
  [disabled]="true"
  [value]="true"></cps-checkbox>
<cps-checkbox
  label="Disabled checkbox unchecked"
  [disabled]="true"
  [value]="false"></cps-checkbox>`
  },

  valueChangedCheckbox: {
    html: `
<div class="sync-val-example">
  <cps-checkbox
    label="Checkbox with valueChanged event"
    [value]="false"
    (valueChanged)="onValueChanged($event)"></cps-checkbox>
  <div class="sync-val">Value changed to: {{ lastValueChanged }}</div>
</div>`,
    ts: `
lastValueChanged = false;

onValueChanged(value: boolean) {
  this.lastValueChanged = value;
}`
  },

  twoWayBinding: {
    html: `
<div class="sync-val-example">
  <cps-checkbox
    label="Checkbox with two-way binding"
    [(ngModel)]="syncVal"></cps-checkbox>
  <div class="sync-val">Is checked: {{ syncVal }}</div>
</div>`,
    ts: `
syncVal = true;`
  }
};
