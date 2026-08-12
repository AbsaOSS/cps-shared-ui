export const tagExamples: Record<string, { html: string; ts?: string }> = {
  regularTag: {
    html: `
<cps-tag color="warn" label="Regular tag"></cps-tag>`
  },

  disabledTag: {
    html: `
<cps-tag [disabled]="true" color="red" label="Disabled tag"></cps-tag>`
  },

  disabledSelectableTag: {
    html: `
<cps-tag
  [disabled]="true"
  [selectable]="true"
  [value]="false"
  color="red"
  label="Disabled selectable tag"></cps-tag>`
  },

  selectableTag: {
    html: `
<div class="sync-val-example">
  <cps-tag
    [selectable]="true"
    color="info"
    [(ngModel)]="syncVal"
    label="Selectable tag"></cps-tag>
  <div class="sync-val">Is selected: {{ syncVal }}</div>
</div>`,
    ts: `
syncVal = true;`
  },

  valueChangedTag: {
    html: `
<div class="sync-val-example">
  <cps-tag
    [selectable]="true"
    color="info"
    (valueChanged)="onValueChanged($event)"
    label="Tag with valueChanged event"></cps-tag>
  <div class="sync-val">Value changed to: {{ lastValueChanged }}</div>
</div>`,
    ts: `
lastValueChanged = false;

onValueChanged(value: boolean) {
  this.lastValueChanged = value;
}`
  }
};
