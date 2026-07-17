const radioOptionsTs = `
options: CpsRadioOption[] = [
  { label: 'Option 1', value: 'first' },
  { label: 'Option 2', value: 'second' },
  { label: 'Option 3', value: 'third' }
];`;

export const radioExamples: Record<string, { html: string; ts?: string }> = {
  requiredRadioGroup: {
    html: `
<form [formGroup]="form">
  <cps-radio-group
    groupLabel="Radio group where 3rd option must be selected"
    formControlName="requiredRadio"
    [options]="options">
  </cps-radio-group>
</form>`,
    ts: `
private readonly _formBuilder = inject(UntypedFormBuilder);

${radioOptionsTs.trim()}

form!: UntypedFormGroup;

ngOnInit() {
  this.form = this._formBuilder.group({
    requiredRadio: [
      '',
      [
        Validators.required,
        (control: AbstractControl): ValidationErrors | null =>
          this._checkThirdSelected(control)
      ]
    ]
  });
}

private _checkThirdSelected(control: AbstractControl) {
  const val = control.value;
  if (!val) return null;

  if (val !== 'third') {
    return { mustMatch8Dig: 'Only third option must be selected' };
  }
  return null;
}`
  },

  tooltipRadioGroup: {
    html: `
<cps-radio-group
  groupLabel="Radio group with a tooltip"
  [options]="options"
  infoTooltip="Provide any information here"
  value="second">
</cps-radio-group>`,
    ts: radioOptionsTs
  },

  verticalRadioGroup: {
    html: `
<cps-radio-group
  groupLabel="Vertical radio group"
  [options]="options"
  value="second"
  [vertical]="true">
</cps-radio-group>`,
    ts: radioOptionsTs
  },

  disabledVerticalRadioGroup: {
    html: `
<cps-radio-group
  groupLabel="Disabled vertical radio group"
  [options]="options"
  value="second"
  [disabled]="true"
  [vertical]="true">
</cps-radio-group>`,
    ts: radioOptionsTs
  },

  partiallyDisabledRadioGroup: {
    html: `
<cps-radio-group
  groupLabel="Radio group with partially disabled options and targeted tooltips"
  [options]="partiallyDisabledOptions">
</cps-radio-group>`,
    ts: `
partiallyDisabledOptions: CpsRadioOption[] = [
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
  { label: 'Option 4', value: 'fourth' }
];`
  },

  twoWayBindingRadioGroup: {
    html: `
<div class="sync-val-example">
  <cps-radio-group
    groupLabel="Radio group with two-way binding"
    [options]="options"
    [(ngModel)]="syncVal">
  </cps-radio-group>
  <div class="sync-val">Selected value: {{ syncVal }}</div>
</div>`,
    ts: `
${radioOptionsTs.trim()}

syncVal = 'first';`
  },

  customContentRadioGroup: {
    html: `
<cps-radio-group
  groupLabel="Radio group with custom content"
  [value]="2"
  [vertical]="true">
  <cps-radio
    [option]="{
      ariaLabel: 'Custom option with inline selectors',
      value: 1
    }">
    <div style="display: flex; align-items: center; gap: 0.3125rem;">
      <span>On the</span>
      <cps-select
        ariaLabel="Select day"
        [options]="dayOptions"
        optionLabel="name"
        [hideDetails]="true"
        [value]="dayOptions[0]">
      </cps-select>
      <span>of every</span>
      <cps-select
        ariaLabel="Select month"
        [options]="monthOptions"
        optionLabel="name"
        [hideDetails]="true"
        [value]="monthOptions[0]">
      </cps-select>
      <span>month(s) at</span>
      <cps-select
        ariaLabel="Select hour"
        [options]="hourOptions"
        optionLabel="name"
        [hideDetails]="true"
        [value]="hourOptions[0]">
      </cps-select>
      <span>:</span>
      <cps-select
        ariaLabel="Select minute"
        [options]="minuteOptions"
        optionLabel="name"
        [hideDetails]="true"
        [value]="minuteOptions[0]">
      </cps-select>
      <cps-checkbox
        style="margin-left: 0.9375rem;"
        label="During the nearest weekday"
        [value]="false"></cps-checkbox>
    </div>
  </cps-radio>
  <cps-radio [option]="{ label: 'Simple option', value: 2 }"></cps-radio>
</cps-radio-group>`,
    ts: `
dayOptions = [
  { name: '1st day', data: { code: '1' } },
  { name: '2nd day', data: { code: '2' } },
  { name: '3rd day', data: { code: '3' } }
];

monthOptions = [...Array(12).keys()].map((n) => ({
  name: n + 1,
  data: { code: n + 1 }
}));

hourOptions = [...Array(24).keys()].map((n) => ({
  name: n,
  data: { code: n }
}));

minuteOptions = [...Array(60).keys()].map((n) => ({
  name: n,
  data: { code: n }
}));`
  }
};
