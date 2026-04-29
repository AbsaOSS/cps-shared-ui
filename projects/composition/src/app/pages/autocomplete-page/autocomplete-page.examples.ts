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

export const autocompleteExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  required: {
    html: `
<cps-autocomplete
  label="Required single autocomplete with a tooltip"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  infoTooltip="Provide any information here"
  placeholder="Enter a city"
  [clearable]="true"
  formControlName="requiredAutocomplete">
</cps-autocomplete>`,
    ts: `
${citiesOptionsTs.trim()}

form = this.fb.group({
  requiredAutocomplete: [this.options[1], [Validators.required]]
});`
  },

  singleAsync: {
    html: `
<cps-autocomplete
  label="Single search autocomplete with fetched options list"
  hint="Fetches matching options from the server based on user input"
  [options]="singleOptionsObservable$ | async"
  optionLabel="name"
  optionInfo="info"
  placeholder="Search a city"
  [clearable]="true"
  [loading]="isSingleLoading"
  loadingMessage="Loading cities..."
  emptyMessage="No cities found"
  (inputChanged)="onSingleInputChanged($event)">
</cps-autocomplete>`,
    ts: `
isSingleLoading = false;
singleOptionsObservable$: Observable<City[]>;

onSingleInputChanged(val: string): void {
  if (val) this.filterSubject$.next(val);
}`
  },

  multipleAsync: {
    html: `
<cps-autocomplete
  label="Multiple search autocomplete with fetched options list"
  hint="Fetches matching options from the server based on user input"
  [options]="multiOptionsObservable$ | async"
  optionLabel="name"
  optionInfo="info"
  placeholder="Search cities"
  [clearable]="true"
  [multiple]="true"
  [loading]="isMultiLoading"
  loadingMessage="Loading cities..."
  emptyMessage="No cities found"
  (inputChanged)="onMultiInputChanged($event)">
</cps-autocomplete>`,
    ts: `
isMultiLoading = false;
multiOptionsObservable$: Observable<City[]>;

onMultiInputChanged(val: string): void {
  if (val) this.filterSubject$.next(val);
}`
  },

  disabled: {
    html: `
<cps-autocomplete
  label="Disabled autocomplete"
  [disabled]="true"
  hint="This autocomplete is disabled">
</cps-autocomplete>`
  },

  multipleNotClearable: {
    html: `
<cps-autocomplete
  label="Multiple autocomplete"
  [options]="options"
  optionLabel="name"
  optionValue="data"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="false"
  [multiple]="true"
  [chips]="false"
  [returnObject]="false"
  [value]="[{ code: 'CPT' }]"
  hint="This autocomplete is not clearable">
</cps-autocomplete>`,
    ts: citiesOptionsTs
  },

  virtualScroll: {
    html: `
<cps-autocomplete
  label="Multiple autocomplete with virtual scroll, chips and persistent clear icon"
  [options]="options"
  hint="This autocomplete doesn't have Select All option"
  [virtualScroll]="true"
  [selectAll]="false"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [persistentClear]="true"
  [value]="[options[0], options[4]]">
</cps-autocomplete>`,
    ts: citiesOptionsTs
  },

  nonClosableChips: {
    html: `
<cps-autocomplete
  label="Multiple autocomplete with non-closable chips"
  [returnObject]="false"
  [options]="options"
  optionLabel="name"
  optionValue="data"
  optionInfo="info"
  placeholder="Enter a city"
  hint="This autocomplete doesn't have a chevron icon"
  [showChevron]="false"
  [clearable]="true"
  [multiple]="true"
  [closableChips]="false"
  [value]="[options[0].data, options[4].data]">
</cps-autocomplete>`,
    ts: citiesOptionsTs
  },

  prefixIcon: {
    html: `
<cps-autocomplete
  label="Multiple autocomplete with prefix icon"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  [value]="[options[5]]">
</cps-autocomplete>`,
    ts: citiesOptionsTs
  },

  twoWayBinding: {
    html: `
<cps-autocomplete
  width="31.25rem"
  label="Multiple autocomplete with two-way binding and keeping initial items order"
  [returnObject]="false"
  [options]="syncOptions"
  [keepInitialOrder]="true"
  optionLabel="title"
  optionValue="val"
  optionInfo="ticker"
  placeholder="Enter a company"
  hint="This autocomplete has a fixed width of 500px"
  [clearable]="true"
  [multiple]="true"
  [closableChips]="false"
  [(ngModel)]="syncVal"
  [ngModelOptions]="{ standalone: true }">
</cps-autocomplete>
<span>{{ syncVal }}</span>`,
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
syncVal: string[] = [];`
  },

  underlined: {
    html: `
<cps-autocomplete
  label="Underlined autocomplete"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  appearance="underlined">
</cps-autocomplete>`,
    ts: citiesOptionsTs
  },

  borderless: {
    html: `
<cps-autocomplete
  label="Borderless autocomplete"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Enter a city"
  [clearable]="true"
  [multiple]="true"
  [chips]="false"
  prefixIcon="search"
  appearance="borderless">
</cps-autocomplete>`,
    ts: citiesOptionsTs
  },

  asyncValidation: {
    html: `
<cps-autocomplete
  label="Autocomplete with async validation"
  [options]="options"
  optionLabel="name"
  optionInfo="info"
  placeholder="Select a city"
  [clearable]="true"
  [(ngModel)]="selectedOption"
  [ngModelOptions]="{ standalone: true }"
  [validating]="validating"
  (valueChanged)="onOptionSelected($event)"
  [externalError]="externalError"
  hint="Simulates async validation upon selection">
</cps-autocomplete>`,
    ts: `
validating = false;
externalError = '';
selectedOption: Option | null = null;

onOptionSelected(option: Option): void {
  this.validating = true;
  this.externalError = '';
  of(option).pipe(delay(3000)).subscribe({
    next: () => (this.validating = false),
    error: () => (this.externalError = 'Validation failed')
  });
}`
  }
};
