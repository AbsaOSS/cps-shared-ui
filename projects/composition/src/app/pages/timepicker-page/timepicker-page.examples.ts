export const timepickerExamples: Record<string, { html: string; ts?: string }> =
  {
    requiredTimepicker: {
      html: `
<form [formGroup]="form">
  <cps-timepicker
    label="Required 12-hour timepicker with a tooltip"
    formControlName="requiredTimepicker"
    infoTooltip="Provide any information here"></cps-timepicker>
</form>`,
      ts: `
private readonly _formBuilder = inject(UntypedFormBuilder);

form!: UntypedFormGroup;

ngOnInit() {
  const defVal: CpsTime = {
    hours: '11',
    minutes: '10',
    dayPeriod: 'PM'
  };
  this.form = this._formBuilder.group({
    requiredTimepicker: [defVal, [Validators.required]]
  });
}`
    },

    disabledTimepicker: {
      html: `
<cps-timepicker
  label="Disabled 12-hour timepicker"
  [disabled]="true"
  hint="This timepicker is disabled">
</cps-timepicker>`
    },

    secondsTimepicker: {
      html: `
<cps-timepicker
  label="12-hour timepicker with seconds"
  (valueChanged)="onValueChanged($event)"
  [withSeconds]="true">
</cps-timepicker>`,
      ts: `
onValueChanged(val: CpsTime) {
  console.log('onValueChanged', val);
}`
    },

    use24HourTimepicker: {
      html: `
<cps-timepicker label="24-hour timepicker" [use24HourTime]="true">
</cps-timepicker>`
    },

    use24HourSecondsTimepicker: {
      html: `
<cps-timepicker
  label="24-hour timepicker with seconds"
  [use24HourTime]="true"
  [value]="val24"
  [withSeconds]="true">
</cps-timepicker>`,
      ts: `
val24: CpsTime = {
  hours: '22',
  minutes: '59',
  seconds: '59'
};`
    },

    twoWayBindingTimepicker: {
      html: `
<div class="sync-val-example">
  <cps-timepicker
    label="12-hour timepicker with two-way binding"
    [(ngModel)]="syncVal"
    [withSeconds]="true"
    [ngModelOptions]="{ standalone: true }">
  </cps-timepicker>
  <span>{{ syncVal | json }}</span>
</div>`,
      ts: `
syncVal: CpsTime = {
  hours: '05',
  minutes: '10',
  seconds: '10',
  dayPeriod: 'PM'
};`
    }
  };
