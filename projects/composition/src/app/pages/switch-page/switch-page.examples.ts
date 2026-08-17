export const switchExamples: Record<string, { html: string; ts?: string }> = {
  tooltipSwitch: {
    html: `
<cps-switch
  label="Switch with tooltip"
  [value]="false"
  infoTooltip="Provide any information here">
</cps-switch>`
  },

  basicSwitch: {
    html: `
<cps-switch label="Basic switch" [value]="true"></cps-switch>`
  },

  unlabeledSwitch: {
    html: `
<cps-switch ariaLabel="Unlabeled switch" [value]="true"></cps-switch>`
  },

  disabledCheckedSwitch: {
    html: `
<cps-switch
  label="Disabled switch checked"
  [disabled]="true"
  [value]="true"></cps-switch>`
  },

  disabledUncheckedSwitch: {
    html: `
<cps-switch
  label="Disabled switch unchecked"
  [disabled]="true"
  [value]="false"></cps-switch>`
  },

  valueChangedSwitch: {
    html: `
<div class="sync-val-example">
  <cps-switch
    label="Switch with valueChanged event"
    [value]="false"
    (valueChanged)="onValueChanged($event)"></cps-switch>
  <div class="sync-val">Value changed to: {{ lastValueChanged }}</div>
</div>`,
    ts: `
lastValueChanged = false;

onValueChanged(value: boolean) {
  this.lastValueChanged = value;
}`
  },

  twoWayBindingSwitch: {
    html: `
<div class="sync-val-example">
  <cps-switch
    label="Switch with two-way binding"
    [(ngModel)]="syncVal"></cps-switch>
  <div class="sync-val">Is checked: {{ syncVal }}</div>
</div>`,
    ts: `
syncVal = true;`
  }
};
