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
  icon="avatar"></cps-checkbox>`
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
