export const textareaExamples: Record<string, { html: string; ts?: string }> = {
  requiredTextarea: {
    html: `
<form [formGroup]="form">
  <cps-textarea
    label="Required textarea with a tooltip"
    placeholder="Please enter any text"
    hint="Maximum 3 characters are allowed"
    infoTooltip="Provide any information here"
    [clearable]="true"
    formControlName="requiredTextarea">
  </cps-textarea>
</form>`,
    ts: `
private readonly _formBuilder = inject(UntypedFormBuilder);

form!: UntypedFormGroup;

ngOnInit() {
  this.form = this._formBuilder.group({
    requiredTextarea: ['', [Validators.required, Validators.maxLength(3)]]
  });
}`
  },

  disabledTextarea: {
    html: `
<cps-textarea label="Disabled textarea" [disabled]="true"></cps-textarea>`
  },

  readonlyTextarea: {
    html: `
<cps-textarea
  label="Readonly textarea"
  hint="This textarea is readonly"
  value="Value to show"
  [readonly]="true">
</cps-textarea>`
  },

  clearableTextarea: {
    html: `
<cps-textarea
  label="Clearable textarea with persistent clear icon"
  hint="This textarea is clearable"
  value="Clear me"
  [clearable]="true"
  [persistentClear]="true">
</cps-textarea>`
  },

  twoWayBindingTextarea: {
    html: `
<div class="sync-val-example">
  <cps-textarea
    width="25rem"
    label="Textarea with two-way binding, type something in"
    [(ngModel)]="syncVal"
    resizable="none"
    hint="This textarea has a fixed width of 25rem and is not resizable"
    [ngModelOptions]="{ standalone: true }">
  </cps-textarea>
  <span class="sync-val">{{ syncVal }}</span>
</div>`,
    ts: `
syncVal = '';`
  }
};
