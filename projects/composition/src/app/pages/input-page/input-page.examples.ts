export const inputExamples: Record<string, { html: string; ts?: string }> = {
  requiredNumericInput: {
    html: `
<form [formGroup]="form">
  <cps-input
    label="Required numeric input with a tooltip"
    formControlName="requiredInput"
    placeholder="Enter 8 digit value"
    infoTooltip="Provide any information here"
    type="number"></cps-input>
</form>`,
    ts: `
// inject(UntypedFormBuilder) used here

form!: UntypedFormGroup;

ngOnInit() {
  this.form = this._formBuilder.group({
    requiredInput: [
      '',
      [
        Validators.required,
        (control: AbstractControl): ValidationErrors | null =>
          this._checkDigits(control)
      ]
    ]
  });
}

private _checkDigits(control: AbstractControl) {
  const val = control.value;
  if (!val) return null;

  if (!/\\b\\d{8}\\b/g.test(val)) {
    return { mustMatch8Dig: 'Field must contain exactly 8 digits' };
  }
  return null;
}`
  },

  loadingInput: {
    html: `
<cps-input
  label="Loading input"
  hint="This input is currently in a loading state"
  [loading]="true"></cps-input>`
  },

  passwordInput: {
    html: `
<cps-input
  label="Password input"
  placeholder="Enter password"
  [clearable]="true"
  type="password"></cps-input>`
  },

  disabledInput: {
    html: `
<cps-input
  label="Disabled input"
  hint="This input is disabled"
  [disabled]="true"></cps-input>`
  },

  readonlyInput: {
    html: `
<cps-input
  label="Readonly input"
  hint="This input is readonly"
  value="Value to show"
  [readonly]="true"></cps-input>`
  },

  clearableWithPersistentIcon: {
    html: `
<cps-input
  label="Clearable input with persistent clear icon"
  hint="This input is clearable"
  value="Clear me"
  [clearable]="true"
  [persistentClear]="true"></cps-input>`
  },

  prefixIconInput: {
    html: `
<cps-input
  label="Input with prefix icon"
  prefixIcon="search"
  placeholder="Search something"
  [clearable]="true"></cps-input>`
  },

  prefixTextInput: {
    html: `
<cps-input
  label="Input with prefix text"
  prefixText="USD"
  placeholder="Enter amount"></cps-input>`
  },

  twoWayBinding: {
    html: `
<div class="sync-val-example">
  <cps-input
    width="25rem"
    label="Input with two-way binding, type something in"
    [(ngModel)]="syncVal"
    hint="This input has a fixed width of 25rem"
    [ngModelOptions]="{ standalone: true }"></cps-input>
  <span class="sync-val">{{ syncVal }}</span>
</div>`,
    ts: `
syncVal = '';`
  },

  clickablePrefixIconUnderlined: {
    html: `
<cps-input
  label="Underlined input with clickable prefix icon"
  [prefixIconClickable]="true"
  prefixIconAriaLabel="Search"
  (prefixIconClicked)="onClickPrefixIcon()"
  prefixIcon="search"
  appearance="underlined"
  placeholder="Search something"
  [clearable]="true"></cps-input>`,
    ts: `
// inject(CpsNotificationService) used here

onClickPrefixIcon() {
  this._notifService.info(\`Prefix icon clicked\`, undefined, {
    timeout: 2000
  });
}`
  },

  borderlessInput: {
    html: `
<cps-input
  label="Borderless input"
  prefixIcon="search"
  appearance="borderless"
  placeholder="Search something"
  [clearable]="true"></cps-input>`
  }
};
