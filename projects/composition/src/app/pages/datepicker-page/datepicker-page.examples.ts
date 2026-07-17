const todayTs = `
today = new Date();`;

export const datepickerExamples: Record<string, { html: string; ts?: string }> =
  {
    requiredDatepicker: {
      html: `
<form [formGroup]="form">
  <cps-datepicker
    label="Required datepicker with a tooltip"
    [clearable]="true"
    infoTooltip="Provide any information here"
    formControlName="requiredDatepicker">
  </cps-datepicker>
</form>`,
      ts: `
// inject(UntypedFormBuilder) used here

form!: UntypedFormGroup;

ngOnInit(): void {
  this.form = this._formBuilder.group({
    requiredDatepicker: [null, [Validators.required]]
  });
}`
    },

    disabledDatepicker: {
      html: `
<cps-datepicker
  label="Disabled datepicker"
  [clearable]="true"
  [disabled]="true"
  hint="This datepicker is disabled"
  [value]="today">
</cps-datepicker>`,
      ts: todayTs
    },

    dropdownOnInputFocus: {
      html: `
<cps-datepicker
  label="Datepicker with a dropdown on input focus"
  hint="This datepicker shows a calendar when input field is focused"
  [value]="today"
  [clearable]="true"
  [openOnInputFocus]="true">
</cps-datepicker>`,
      ts: todayTs
    },

    restrictedDateRange: {
      html: `
<cps-datepicker
  label="Datepicker with restricted date range"
  hint="This datepicker has selectable dates from 01/01/2023 to 12/31/2025"
  [showTodayButton]="false"
  [value]="defaultDate"
  [clearable]="true"
  [minDate]="minDate"
  [maxDate]="maxDate">
</cps-datepicker>`,
      ts: `
defaultDate = new Date(2023, 2, 16);
minDate = new Date(2023, 0, 1);
maxDate = new Date(2025, 11, 31);`
    },

    withoutTodayButton: {
      html: `
<cps-datepicker
  label="Datepicker without Today button"
  [clearable]="true"
  [showTodayButton]="false">
</cps-datepicker>`
    },

    customDateFormat: {
      html: `
<cps-datepicker
  label="Datepicker with DD/MM/YYYY date format"
  [clearable]="true"
  dateFormat="DD/MM/YYYY">
</cps-datepicker>`
    },

    twoWayBinding: {
      html: `
<div class="sync-val-example">
  <cps-datepicker
    [clearable]="true"
    label="Datepicker with two-way binding, select a date"
    [(ngModel)]="syncVal"
    width="25rem"
    hint="This datepicker has a fixed width of 25rem"
    placeholder="Select a date"
    [ngModelOptions]="{ standalone: true }">
  </cps-datepicker>
  <div class="sync-val">{{ syncVal }}</div>
</div>`,
      ts: `
syncVal = null;`
    },

    underlinedDatepicker: {
      html: `
<cps-datepicker
  label="Underlined datepicker"
  hint="This datepicker shows a calendar when input field is focused"
  [value]="today"
  appearance="underlined"
  [clearable]="true"
  [openOnInputFocus]="true">
</cps-datepicker>`,
      ts: todayTs
    },

    borderlessDatepicker: {
      html: `
<cps-datepicker
  label="Borderless datepicker"
  hint="This datepicker shows a calendar when input field is focused"
  [value]="today"
  appearance="borderless"
  [clearable]="true"
  [openOnInputFocus]="true">
</cps-datepicker>`,
      ts: todayTs
    }
  };
