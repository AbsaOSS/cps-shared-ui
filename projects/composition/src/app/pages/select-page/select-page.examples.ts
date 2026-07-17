const citiesOptionsTs = `
options = [
  { name: 'New York', data: { code: 'NY' } },
  { name: 'Prague', data: { code: 'PRG' }, info: 'Prague info' },
  { name: 'Capetown', data: { code: 'CPT' }, info: 'Capetown info' },
  { name: 'Rome', data: { code: 'RM' } },
  { name: 'London', data: { code: 'LDN' }, info: 'London info' },
  { name: 'Istanbul', data: { code: 'IST' } },
  { name: 'Paris', data: { code: 'PRS' } },
  { name: 'Tokyo', data: { code: 'TOK' } },
  { name: 'Oslo', data: { code: 'OSL' }, info: 'Oslo info' },
  { name: 'Berlin', data: { code: 'BER' } }
];`;

export const selectExamples: Record<string, { html: string; ts?: string }> = {
  requiredSelect: {
    html: `
<form [formGroup]="form">
  <cps-select
    label="Required single select with a tooltip"
    [options]="options"
    optionLabel="name"
    optionInfo="info"
    placeholder="Select a city"
    infoTooltip="Provide any information here"
    [clearable]="true"
    formControlName="requiredSelect">
  </cps-select>
</form>`,
    ts: `
private readonly _formBuilder = inject(UntypedFormBuilder);

${citiesOptionsTs.trim()}

form!: UntypedFormGroup;

ngOnInit(): void {
  this.form = this._formBuilder.group({
    requiredSelect: [this.options[1], [Validators.required]]
  });
}`
  },

  loadingSelect: {
    html: `
<cps-select
  label="Loading select"
  [loading]="true"
  [options]="options"
  optionLabel="name"
  hint="This select is currently in a loading state">
</cps-select>`,
    ts: citiesOptionsTs
  },

  disabledSelect: {
    html: `
<cps-select
  label="Disabled select"
  [disabled]="true"
  hint="This select is disabled">
</cps-select>`
  },

  multipleSelect: {
    html: `
<cps-select
  label="Multiple select"
  [options]="options"
  optionLabel="name"
  optionValue="data"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="false"
  [multiple]="true"
  [chips]="false"
  [returnObject]="false"
  [value]="[{ code: 'CPT' }]"
  hint="This select is not clearable"></cps-select>`,
    ts: citiesOptionsTs
  },

  virtualScrollSelect: {
    html: `
<cps-select
  label="Multiple select with virtual scroll, chips and persistent clear icon"
  hint="This select doesn't have Select All option"
  [selectAll]="false"
  [virtualScroll]="true"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="true"
  [multiple]="true"
  [persistentClear]="true"
  [value]="[options[0], options[4]]"></cps-select>`,
    ts: citiesOptionsTs
  },

  nonClosableChipsSelect: {
    html: `
<cps-select
  label="Multiple select with non-closable chips"
  [returnObject]="false"
  [options]="options"
  optionLabel="name"
  optionValue="data"
  optionInfo="info"
  placeholder="Select a city"
  hint="This select doesn't have a chevron icon"
  [showChevron]="false"
  [clearable]="true"
  [multiple]="true"
  [closableChips]="false"
  [value]="[options[0].data, options[4].data]"></cps-select>`,
    ts: citiesOptionsTs
  },

  prefixIconSelect: {
    html: `
<cps-select
  label="Multiple select with prefix icon"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="plus"
  [value]="[options[5]]">
</cps-select>`,
    ts: citiesOptionsTs
  },

  iconsSelect: {
    html: `
<cps-select
  label="Single select with options icons"
  [options]="statusOptions"
  optionLabel="name"
  optionIconColor="color"
  placeholder="Select a status">
</cps-select>`,
    ts: `
statusOptions = [
  { name: 'Success', icon: 'circle', color: 'success' },
  { name: 'Pending', icon: 'circle', color: 'info' },
  { name: 'Warning', icon: 'circle', color: 'warn' },
  { name: 'Failed', icon: 'circle', color: 'error' }
];`
  },

  twoWayBindingSelect: {
    html: `
<div class="sync-val-example">
  <cps-select
    width="31.25rem"
    label="Multiple select with two-way binding and keeping initial items order"
    [returnObject]="false"
    [options]="syncOptions"
    [keepInitialOrder]="true"
    optionLabel="title"
    optionValue="val"
    optionInfo="ticker"
    placeholder="Select a company"
    hint="This select has a fixed width of 31.25rem"
    [clearable]="true"
    [multiple]="true"
    [closableChips]="false"
    [(ngModel)]="syncVal"
    [ngModelOptions]="{ standalone: true }"></cps-select>
  <span class="sync-val">{{ syncVal }}</span>
</div>`,
    ts: `
syncOptions = [
  { title: 'Amazon', val: 'AMZN', ticker: 'AMZN' },
  { title: 'Apple', val: 'AAPL', ticker: 'AAPL' },
  { title: 'Google', val: 'GOOGL', ticker: 'GOOGL' },
  { title: 'Meta', val: 'META', ticker: 'META' },
  { title: 'Microsoft', val: 'MSFT', ticker: 'MSFT' },
  { title: 'Netflix', val: 'NFLX', ticker: 'NFLX' },
  { title: 'Tesla', val: 'TSLA', ticker: 'TSLA' }
];
syncVal: any = [];`
  },

  underlinedSelect: {
    html: `
<cps-select
  label="Underlined select"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  appearance="underlined">
</cps-select>`,
    ts: citiesOptionsTs
  },

  borderlessSelect: {
    html: `
<cps-select
  label="Borderless select"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  appearance="borderless">
</cps-select>`,
    ts: citiesOptionsTs
  }
};
